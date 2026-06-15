import { Op } from "sequelize";
import {
  Student,
  Teacher,
  Group,
  Payment,
  Branch,
  Room,
  Expense,
} from "../Models";
import { sendWorkbook, SheetSpec } from "../Utils/excel.helper";

/* ----------------------------- Yordamchi funksiyalar ----------------------------- */

/**
 * Entity'ning branch_id maydoni bo'yicha access-scope (filial ruxsati) where shartini quradi.
 * - superadmin: hammasi
 * - manager/director: faqat o'z scope.branchIds ichidagilari
 * Agar query'da ?branch_id= berilgan bo'lsa, faqat ruxsat doirasidagi shu filialga cheklaydi.
 */
function branchWhere(
  req: any,
  extra: Record<string, any> = {},
  field = "branch_id"
): Record<string, any> {
  const scope = req.scope || { all: false, branchIds: [] };
  const where: Record<string, any> = { ...extra };
  const requested = req.query?.branch_id ? String(req.query.branch_id) : null;

  if (scope.all) {
    if (requested) where[field] = requested;
    return where;
  }

  let ids: string[] = Array.isArray(scope.branchIds) ? scope.branchIds : [];
  if (requested) {
    ids = ids.includes(requested) ? [requested] : [];
  }
  where[field] = { [Op.in]: ids };
  return where;
}

/**
 * Scope ichidagi barcha filiallarning id -> nom xaritasini qaytaradi.
 * (Faqat nomlarni ko'rsatish uchun, query branch_id filtri bu yerga ta'sir qilmaydi.)
 */
async function getBranchMap(req: any): Promise<Record<string, string>> {
  const scope = req.scope || { all: false, branchIds: [] };
  const where: Record<string, any> = {};
  if (!scope.all) {
    where.id = { [Op.in]: Array.isArray(scope.branchIds) ? scope.branchIds : [] };
  }
  const branches: any[] = await Branch.findAll({
    where,
    attributes: ["id", "name"],
    raw: true,
  });
  const map: Record<string, string> = {};
  for (const b of branches) map[b.id] = b.name;
  return map;
}

const onlyDate = (v: any): string => (v ? String(v).slice(0, 10) : "");

const dateTime = (v: any): string => {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fullName = (p: any): string =>
  p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() : "";

/* ----------------------------- Sheet quruvchilar ----------------------------- */

async function buildStudentsSheet(req: any): Promise<SheetSpec> {
  const branchMap = await getBranchMap(req);
  const groupId = req.query?.group_id ? String(req.query.group_id) : null;

  const students: any[] = await Student.findAll({
    where: branchWhere(req),
    include: [
      {
        model: Group,
        as: "groups",
        attributes: ["id", "group_subject"],
        through: { attributes: [] },
        required: !!groupId,
        ...(groupId ? { where: { id: groupId } } : {}),
      },
    ],
    order: [["created_at", "DESC"]],
  });

  const rows = students.map((s) => {
    const p = s.get({ plain: true });
    return {
      studental_id: p.studental_id ?? "",
      first_name: p.first_name ?? "",
      last_name: p.last_name ?? "",
      father_name: p.father_name ?? "",
      mother_name: p.mother_name ?? "",
      birth_date: onlyDate(p.birth_date),
      phone_number: p.phone_number ?? "",
      parents_phone_number: p.parents_phone_number ?? "",
      branch: branchMap[p.branch_id] ?? "",
      groups: (p.groups || []).map((g: any) => g.group_subject).join(", "),
      came_in_school: onlyDate(p.came_in_school),
      left_school: onlyDate(p.left_school),
      created_at: dateTime(p.created_at),
    };
  });

  return {
    name: "O'quvchilar",
    columns: [
      { header: "ID raqami", key: "studental_id", width: 16 },
      { header: "Ism", key: "first_name", width: 18 },
      { header: "Familiya", key: "last_name", width: 18 },
      { header: "Otasining ismi", key: "father_name", width: 18 },
      { header: "Onasining ismi", key: "mother_name", width: 18 },
      { header: "Tug'ilgan sana", key: "birth_date", width: 14 },
      { header: "Telefon", key: "phone_number", width: 16 },
      { header: "Ota-ona telefoni", key: "parents_phone_number", width: 18 },
      { header: "Filial", key: "branch", width: 18 },
      { header: "Guruhlar", key: "groups", width: 30 },
      { header: "Kelgan sana", key: "came_in_school", width: 14 },
      { header: "Ketgan sana", key: "left_school", width: 14 },
      { header: "Ro'yxatga olingan", key: "created_at", width: 18 },
    ],
    rows,
  };
}

async function buildTeachersSheet(req: any): Promise<SheetSpec> {
  const branchMap = await getBranchMap(req);

  const teachers: any[] = await Teacher.findAll({
    where: branchWhere(req),
    include: [
      { model: Group, as: "groups", attributes: ["id"], required: false },
    ],
    order: [["created_at", "DESC"]],
  });

  const rows = teachers.map((t) => {
    const p = t.get({ plain: true });
    return {
      first_name: p.first_name ?? "",
      last_name: p.last_name ?? "",
      father_name: p.father_name ?? "",
      phone_number: p.phone_number ?? "",
      subject: p.subject ?? "",
      branch: branchMap[p.branch_id] ?? "",
      username: p.username ?? "",
      groups_count: (p.groups || []).length,
      birth_date: onlyDate(p.birth_date),
      created_at: dateTime(p.created_at),
    };
  });

  return {
    name: "Ustozlar",
    columns: [
      { header: "Ism", key: "first_name", width: 18 },
      { header: "Familiya", key: "last_name", width: 18 },
      { header: "Otasining ismi", key: "father_name", width: 18 },
      { header: "Telefon", key: "phone_number", width: 16 },
      { header: "Fan", key: "subject", width: 18 },
      { header: "Filial", key: "branch", width: 18 },
      { header: "Login", key: "username", width: 16 },
      { header: "Guruhlar soni", key: "groups_count", width: 14 },
      { header: "Tug'ilgan sana", key: "birth_date", width: 14 },
      { header: "Ro'yxatga olingan", key: "created_at", width: 18 },
    ],
    rows,
  };
}

async function buildGroupsSheet(req: any): Promise<SheetSpec> {
  const branchMap = await getBranchMap(req);
  const teacherId = req.query?.teacher_id ? String(req.query.teacher_id) : null;
  const groupId = req.query?.group_id ? String(req.query.group_id) : null;

  const extra: Record<string, any> = {};
  if (teacherId) extra.teacher_id = teacherId;
  if (groupId) extra.id = groupId;

  const groups: any[] = await Group.findAll({
    where: branchWhere(req, extra),
    include: [
      {
        model: Teacher,
        as: "teacher",
        attributes: ["first_name", "last_name"],
        required: false,
      },
      { model: Room, as: "room", attributes: ["name"], required: false },
    ],
    order: [["created_at", "DESC"]],
  });

  const rows = groups.map((g) => {
    const p = g.get({ plain: true });
    return {
      group_subject: p.group_subject ?? "",
      teacher: fullName(p.teacher),
      days: p.days ?? "",
      start_time: p.start_time ?? "",
      end_time: p.end_time ?? "",
      monthly_fee: p.monthly_fee ?? 0,
      students_amount: p.students_amount ?? 0,
      paid_students_amount: p.paid_students_amount ?? 0,
      room: p.room?.name ?? "",
      branch: branchMap[p.branch_id] ?? "",
      created_at: dateTime(p.created_at),
    };
  });

  return {
    name: "Guruhlar",
    columns: [
      { header: "Guruh / Fan", key: "group_subject", width: 24 },
      { header: "Ustoz", key: "teacher", width: 22 },
      { header: "Kunlar", key: "days", width: 16 },
      { header: "Boshlanish", key: "start_time", width: 12 },
      { header: "Tugash", key: "end_time", width: 12 },
      { header: "Oylik to'lov", key: "monthly_fee", width: 14 },
      { header: "O'quvchilar soni", key: "students_amount", width: 16 },
      { header: "To'lagan o'quvchilar", key: "paid_students_amount", width: 18 },
      { header: "Xona", key: "room", width: 14 },
      { header: "Filial", key: "branch", width: 18 },
      { header: "Yaratilgan", key: "created_at", width: 18 },
    ],
    rows,
  };
}

async function buildPaymentsSheet(req: any): Promise<SheetSpec> {
  const branchMap = await getBranchMap(req);
  const groupId = req.query?.group_id ? String(req.query.group_id) : null;
  const month = req.query?.month ? String(req.query.month) : null;

  const extra: Record<string, any> = {};
  if (groupId) extra.group_id = groupId;
  if (month) extra.for_which_month = month;

  const payments: any[] = await Payment.findAll({
    where: branchWhere(req, extra),
    include: [
      {
        model: Student,
        as: "student",
        attributes: ["first_name", "last_name"],
        required: false,
      },
      {
        model: Group,
        as: "paymentGroup",
        attributes: ["group_subject"],
        required: false,
      },
    ],
    order: [["created_at", "DESC"]],
  });

  const rows = payments.map((pay) => {
    const p = pay.get({ plain: true });
    return {
      student: fullName(p.student),
      group: p.paymentGroup?.group_subject ?? "",
      payment_amount: p.payment_amount ?? 0,
      payment_type: p.payment_type ?? "",
      received: p.received ?? "",
      for_which_month: p.for_which_month ?? "",
      branch: branchMap[p.branch_id] ?? "",
      comment: p.comment ?? "",
      created_at: dateTime(p.created_at),
    };
  });

  return {
    name: "To'lovlar",
    columns: [
      { header: "O'quvchi", key: "student", width: 24 },
      { header: "Guruh", key: "group", width: 22 },
      { header: "Summa", key: "payment_amount", width: 14 },
      { header: "To'lov turi", key: "payment_type", width: 16 },
      { header: "Qabul qildi", key: "received", width: 18 },
      { header: "Qaysi oy uchun", key: "for_which_month", width: 16 },
      { header: "Filial", key: "branch", width: 18 },
      { header: "Izoh", key: "comment", width: 24 },
      { header: "To'lov sanasi", key: "created_at", width: 18 },
    ],
    rows,
  };
}

async function buildExpensesSheet(req: any): Promise<SheetSpec> {
  const branchMap = await getBranchMap(req);

  const expenses: any[] = await Expense.findAll({
    where: branchWhere(req),
    order: [["date", "DESC"]],
  });

  const rows = expenses.map((e) => {
    const p = e.get({ plain: true });
    return {
      title: p.title ?? "",
      amount: p.amount ?? 0,
      date: onlyDate(p.date),
      branch: branchMap[p.branch_id] ?? "",
      created_at: dateTime(p.created_at),
    };
  });

  return {
    name: "Xarajatlar",
    columns: [
      { header: "Nomi", key: "title", width: 30 },
      { header: "Summa", key: "amount", width: 16 },
      { header: "Sana", key: "date", width: 14 },
      { header: "Filial", key: "branch", width: 18 },
      { header: "Kiritilgan", key: "created_at", width: 18 },
    ],
    rows,
  };
}

/* ----------------------------- Controllerlar ----------------------------- */

export async function exportStudents(req: any, res: any, next: any) {
  try {
    const sheet = await buildStudentsSheet(req);
    await sendWorkbook(res, [sheet], "oquvchilar.xlsx");
  } catch (e) {
    next(e);
  }
}

export async function exportTeachers(req: any, res: any, next: any) {
  try {
    const sheet = await buildTeachersSheet(req);
    await sendWorkbook(res, [sheet], "ustozlar.xlsx");
  } catch (e) {
    next(e);
  }
}

export async function exportGroups(req: any, res: any, next: any) {
  try {
    const sheet = await buildGroupsSheet(req);
    await sendWorkbook(res, [sheet], "guruhlar.xlsx");
  } catch (e) {
    next(e);
  }
}

export async function exportPayments(req: any, res: any, next: any) {
  try {
    const sheet = await buildPaymentsSheet(req);
    await sendWorkbook(res, [sheet], "tolovlar.xlsx");
  } catch (e) {
    next(e);
  }
}

export async function exportExpenses(req: any, res: any, next: any) {
  try {
    const sheet = await buildExpensesSheet(req);
    await sendWorkbook(res, [sheet], "xarajatlar.xlsx");
  } catch (e) {
    next(e);
  }
}

/** Barcha asosiy ma'lumotlarni bitta faylda (har biri alohida varaqda) */
export async function exportAll(req: any, res: any, next: any) {
  try {
    const sheets = await Promise.all([
      buildStudentsSheet(req),
      buildTeachersSheet(req),
      buildGroupsSheet(req),
      buildPaymentsSheet(req),
      buildExpensesSheet(req),
    ]);
    await sendWorkbook(res, sheets, "crm_malumotlari.xlsx");
  } catch (e) {
    next(e);
  }
}

/** Frontend filtrlari (filiallar va guruhlar ro'yxati) uchun yordamchi endpoint */
export async function getExportFilters(req: any, res: any, next: any) {
  try {
    const scope = req.scope || { all: false, branchIds: [] };
    const branchWhereScoped: Record<string, any> = {};
    if (!scope.all) {
      branchWhereScoped.id = {
        [Op.in]: Array.isArray(scope.branchIds) ? scope.branchIds : [],
      };
    }

    const branches = await Branch.findAll({
      where: branchWhereScoped,
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
      raw: true,
    });

    const groups = await Group.findAll({
      where: branchWhere(req),
      attributes: ["id", "group_subject", "branch_id"],
      order: [["group_subject", "ASC"]],
      raw: true,
    });

    res.status(200).json({ branches, groups });
  } catch (e) {
    next(e);
  }
}
