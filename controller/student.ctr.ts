import { NextFunction, Request, Response } from "express";
import { Sequelize, col, fn, Op, literal } from "sequelize";
import i18next from "../Utils/lang";
import { Appeal, Notification, Payment, Student, User, UserNotification, UserSettings } from "../Models/index";
import { ICreateStudentDto } from "../DTO/student/create_student_dto";
import { BaseError } from "../Utils/base_error";
import { IUpdateStudentDto } from "../DTO/student/update_student_dto";
import { Teacher } from "../Models/index";
import { Group } from "../Models/index";
import { Attendance, AttendanceRecord } from "../Models";
import { getThisMonthTotalPayments, latestPayments } from "./payments.ctr";
import sequelize from "../config/database.config";
import StudentGroup from "../Models/student_groups_model";
import { getRoomsBusinessPercent } from "./room.ctr";
import { DateTime } from "luxon";
import { AttendanceExtension } from "../Models/extend_attendance_model";
import { withBranchScope } from "../Utils/branch_scope.helper";
import { io } from "../server";

const groupTimeZone = "Asia/Tashkent";

const monthsInUzbek: Record<number, string> = {
  1: "Yanvar",
  2: "Fevral",
  3: "Mart",
  4: "Aprel",
  5: "May",
  6: "Iyun",
  7: "Iyul",
  8: "Avgust",
  9: "Sentabr",
  10: "Oktabr",
  11: "Noyabr",
  12: "Dekabr",
};

const changeMonths = (month: number): string | undefined => {
  return monthsInUzbek[month];
};

interface AttendanceStats {
  present: number;
  absent: number;
  total: number;
}

async function generateStudentId(transaction?: any): Promise<string> {
  try {
    const lastStudent = await Student.findOne({
      order: [[Sequelize.literal("CAST(studental_id AS INTEGER)"), "DESC"]],
      attributes: ["studental_id"],
      transaction,
    });
    let newIdNumber = 1;
    if (lastStudent && lastStudent.dataValues.studental_id) {
      const lastId = lastStudent.dataValues.studental_id;
      const parsedId = parseInt(lastId, 10);
      if (!isNaN(parsedId)) {
        newIdNumber = parsedId + 1;
      } else {
        console.warn(`Noto'g'ri studental_id formati: ${lastId}`);
      }
    }

    const newId = newIdNumber.toString().padStart(3, "0");
    const existingStudent = await Student.findOne({
      where: { studental_id: newId },
      transaction,
    });
    if (existingStudent) {
      throw new Error(`ID ${newId} allaqachon mavjud!`);
    }

    return newId;
  } catch (error) {
    console.error("ID yaratishda xato:", error);
    throw new Error("Talaba ID-sini yaratib bo‘lmadi");
  }
}

async function getStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";

    const currentMonth = changeMonths(new Date().getMonth() + 1);
    const currentYear = new Date().getFullYear();

    const month = (req.query.month as string) || currentMonth;
    const year = Number(req.query.year) || currentYear;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const offset = (page - 1) * limit;

    const search = String(req.query.search || "").trim();
    const paymentFilter = String(req.query.paymentFilter || "all").trim();

    const studentWhere: any = {
      ...withBranchScope(req),
    };

    if (search) {
      studentWhere[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        {
          [Op.and]: [
            Sequelize.where(
              fn(
                "concat",
                col("Student.first_name"),
                " ",
                col("Student.last_name")
              ),
              { [Op.iLike]: `%${search}%` }
            ),
          ],
        },
        { phone_number: { [Op.iLike]: `%${search}%` } },
        { father_name: { [Op.iLike]: `%${search}%` } },
        { studental_id: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows: students, count: totalItems } = await Student.findAndCountAll({
      where: studentWhere,
      include: [
        {
          model: Group,
          as: "groups",
          attributes: ["id", "group_subject"],
          through: { attributes: [] },
          include: [
            {
              model: Teacher,
              as: "teacher",
              attributes: ["id", "first_name", "last_name", "phone_number"],
              required: false,
            },
          ],
          required: false,
        },
        {
          model: StudentGroup,
          as: "studentGroups",
          attributes: ["group_id", "paid", "month", "year"],
          required: false,
          where: {
            month,
            year,
          },
          include: [
            {
              model: Group,
              as: "studentGroupParent",
              attributes: [],
              required: true,
              where: withBranchScope(req),
            },
          ],
        },
      ],
      distinct: true,
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    const studentsWithGroups = students.map((student: any) => {
      const plain = typeof student.get === "function"
        ? student.get({ plain: true })
        : student;

      const allGroups = plain.groups?.length || 0;
      const monthStudentGroups = plain.studentGroups || [];
      const totalGroups = monthStudentGroups.length;
      const paidGroups = monthStudentGroups.filter((sg: any) => sg.paid).length;

      return {
        ...plain,
        total_groups: totalGroups,
        paid_groups: paidGroups,
        all_groups: allGroups,
      };
    });

    let filteredStudents = studentsWithGroups;

    if (paymentFilter !== "all") {
      filteredStudents = studentsWithGroups.filter((student: any) => {
        const totalGroups = student.total_groups || 0;
        const paidGroups = student.paid_groups || 0;

        const isFullyPaid = totalGroups > 0 && paidGroups === totalGroups;
        const isPartiallyPaid = totalGroups > 0 && paidGroups > 0 && paidGroups < totalGroups;
        const isUnpaid = totalGroups > 0 && paidGroups === 0;

        return (
          (paymentFilter === "fullyPaid" && isFullyPaid) ||
          (paymentFilter === "partiallyPaid" && isPartiallyPaid) ||
          (paymentFilter === "unpaid" && isUnpaid)
        );
      });
    }

    const totalFilteredItems =
      paymentFilter === "all" ? totalItems : filteredStudents.length;

    const totalPages = Math.max(Math.ceil(totalFilteredItems / limit), 1);

    return res.status(200).json({
      data: filteredStudents,
      pagination: {
        page,
        limit,
        totalItems: totalFilteredItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    next(error);
  }
}

async function getOneStudent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const student = await Student.findOne({
      where: withBranchScope(req, { id: req.params.id }),
      include: [
        {
          model: Group,
          as: "groups",
          attributes: ["id", "group_subject"],
          through: { attributes: [] },
        },
      ],
    });
    if (!student) {
      return next(
        BaseError.BadRequest(404, i18next.t("student_not_found", { lng: lang }))
      );
    }
    res.status(200).json(student);
  } catch (error) {
    next(error);
  }
}

async function getOneGroupStudents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = "uz";
    const groupId = req.query.group_id as string;
    if (!groupId) return res.status(400).json({ error: "group_id required" });

    const students = await Student.findAll({
      where: withBranchScope(req),
      include: [
        {
          model: StudentGroup,
          as: "studentGroups",
          where: { group_id: groupId },
          attributes: [],
          include: [
            {
              model: Group,
              as: "studentGroupParent",
              where: withBranchScope(req),
              attributes: [],
              required: true,
            },
          ],
        },
      ],
    });

    if (students.length === 0) {
      return next(
        BaseError.BadRequest(404, i18next.t("student_not_found", { lng: lang }))
      );
    }
    res.status(200).json(students);
  } catch (error) {
    next(error);
  }
}

async function getOneGroupStudentsForTeacher(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = "uz";
    const groupId = req.query.group_id as string;
    if (!groupId) return res.status(400).json({ error: "group_id required" });

    const students = await Student.findAll({
      include: [
        {
          model: StudentGroup,
          as: "studentGroups",
          where: { group_id: groupId },
          attributes: [],
          include: [
            {
              model: Group,
              as: "studentGroupParent",
              attributes: [],
              required: true,
            },
          ],
        },
      ],
    });

    if (students.length === 0) {
      return next(
        BaseError.BadRequest(404, i18next.t("student_not_found", { lng: lang }))
      );
    }
    res.status(200).json(students);
  } catch (error) {
    next(error);
  }
}

async function createStudent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const branchId = req.scope?.branchIds?.[0];
    if (!branchId) {
      return next(BaseError.BadRequest(403, "Branch aniqlanmadi"));
    }

    const branchManager = await User.findOne({ where: { branch_id: branchId, role: "manager" } })

    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";

    const {
      first_name,
      last_name,
      father_name,
      mother_name,
      birth_date,
      phone_number,
      group_ids,
      parents_phone_number,
      telegram_user_id,
      came_in_school,
      img_url,
      left_school,
    } = req.body as ICreateStudentDto;

    if (!group_ids || !Array.isArray(group_ids) || group_ids.length === 0) {
      return next(
        BaseError.BadRequest(
          400,
          i18next.t("group_ids_required", { lng: lang })
        )
      );
    }

    const t = await sequelize.transaction();
    let student: Student;
    let groupNames: string[] = [];
    try {
      const ReturnedId = await generateStudentId(t);

      student = await Student.create(
        {
          first_name,
          last_name,
          father_name,
          mother_name,
          birth_date,
          phone_number,
          parents_phone_number,
          telegram_user_id,
          came_in_school,
          img_url,
          left_school,
          studental_id: ReturnedId,
          total_groups: group_ids.length,
          paid_groups: 0,
          branch_id: branchId,
        },
        { transaction: t }
      );

      const currentYear = new Date().getFullYear();
      const currentMonthIndex = new Date().getMonth() + 1;

      const monthsToCreate = [];
      for (let m = currentMonthIndex; m <= 12; m++) {
        monthsToCreate.push(monthsInUzbek[m]);
      }

      for (const group_id of group_ids) {
        for (const month of monthsToCreate) {
          await StudentGroup.findOrCreate({
            where: {
              student_id: student.dataValues.id,
              group_id,
              month,
              year: currentYear,
            },
            defaults: {
              paid: false,
            },
            transaction: t,
          });
        }

        const group = await Group.findOne({
          where: withBranchScope(req, { id: group_id }),
          transaction: t,
        });

        if (group) {
          await group.increment("students_amount", { by: 1, transaction: t });
          groupNames.push(group.dataValues.group_subject);
        }
      }

      const studentName = [
        (student as any).first_name,
        (student as any).last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      const targetUsers = await User.findAll({
        where: { role: "director" },
        attributes: ["id"],
        transaction: t,
      });

      const targetUserIds = targetUsers.map((u: any) => u.id);

      const settings = await UserSettings.findAll({
        where: {
          user_id: targetUserIds,
          student_registration: true,
        },
        attributes: ["user_id"],
        transaction: t,
      });

      const enabledUserIds = new Set(settings.map((s: any) => s.user_id));

      const filteredUsers = targetUsers.filter((u: any) => enabledUserIds.has(u.id));

      const notificationsPayload = (filteredUsers as any[]).map((user: any) => ({
        user_id: user.id,
        title: "Yangi o'quvchi qo'shildi",
        message: `${branchManager?.dataValues.username || "O'quvchi"} ${studentName || "O'quvchi"}ni ${groupNames.join(", ")} guruhlariga qo'shdi`,
        type: "success",
        is_read: false,
        meta: {
          pupil_id: student.dataValues.id,
          branch_id: student.dataValues.branch_id,
        },
      }));

      let createdNotifications: any[] = [];

      if (notificationsPayload.length > 0) {
        createdNotifications = await UserNotification.bulkCreate(notificationsPayload, {
          transaction: t,
          returning: true,
        });
      }

      await t.commit();

      if (io && createdNotifications.length > 0) {
        for (const notification of createdNotifications) {
          const roomName = `user:${notification.user_id}`;

          io.to(roomName).emit("new-notification", {
            id: notification.id,
            user_id: notification.user_id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            color:
              notification.type === "success"
                ? "green"
                : notification.type === "warning"
                  ? "yellow"
                  : notification.type === "danger"
                    ? "red"
                    : "blue",
            isRead: Boolean(notification.is_read),
            createdAt: notification.created_at,
            timeAgo: "Hozirgina",
            meta: notification.meta ?? null,
          });
        }
      }

    } catch (error) {
      await t.rollback();
      throw error;
    }

    // transactiondan tashqaridagi ishlar
    try {
      await updateStudentPaymentStatus(student.dataValues.id);

      return res.status(200).json(student);
    } catch (error) {
      console.error("Tranzaksiyadan tashqari xatolik:", error);
      return next(error);
    }
  } catch (error: any) {
    console.error("createStudentda xatolik:", error);
    return next(error);
  }
}

async function updateStudent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const {
      first_name,
      last_name,
      father_name,
      mother_name,
      birth_date,
      phone_number,
      group_ids,
      parents_phone_number,
      telegram_user_id,
      came_in_school,
      img_url,
      left_school,
    } = req.body as IUpdateStudentDto;

    const student = await Student.findOne({
      where: withBranchScope(req, { id: req.params.id }),
    });
    if (!student) {
      return next(
        BaseError.BadRequest(404, i18next.t("student_not_found", { lng: lang }))
      );
    }

    const t = await sequelize.transaction();
    try {
      // Student ma'lumotlarini yangilash
      await student.update(
        {
          first_name,
          last_name,
          father_name,
          mother_name,
          birth_date,
          phone_number,
          parents_phone_number,
          telegram_user_id,
          came_in_school,
          img_url,
          left_school,
        },
        { transaction: t }
      );

      if (group_ids && Array.isArray(group_ids)) {
        const existingStudentGroups = await StudentGroup.findAll({
          where: { student_id: student.dataValues.id },
          transaction: t,
        });

        const existingGroupIds = existingStudentGroups.map((sg) => sg.dataValues.group_id);
        const newGroupIds = group_ids.filter((id) => !existingGroupIds.includes(id));
        const removedGroupIds = existingGroupIds.filter((id) => !group_ids.includes(id));

        const currentYear = new Date().getFullYear();
        const currentMonthIndex = new Date().getMonth() + 1;

        const monthsToCreate = [];
        for (let m = currentMonthIndex; m <= 12; m++) {
          monthsToCreate.push(monthsInUzbek[m]);
        }

        // Eski guruhlarni o'chirish
        for (const groupId of removedGroupIds) {
          const group = await Group.findByPk(groupId, { transaction: t });
          if (group) {
            await group.increment("students_amount", { by: -1, transaction: t });
          }
          await StudentGroup.destroy({
            where: { student_id: student.dataValues.id, group_id: groupId },
            transaction: t,
          });
        }

        // Yangi guruhlar qo'shish — joriy oydan yil oxirigacha
        for (const group_id of newGroupIds) {
          for (const month of monthsToCreate) {
            await StudentGroup.findOrCreate({
              where: {
                student_id: student.dataValues.id,
                group_id,
                month,
                year: currentYear,
              },
              defaults: { paid: false },
              transaction: t,
            });
          }

          const group = await Group.findByPk(group_id, { transaction: t });
          if (group) {
            await group.increment("students_amount", { by: 1, transaction: t });
          }
        }

        // total_groups ni yangilash
        await student.update(
          { total_groups: group_ids.length },
          { transaction: t }
        );
      }

      await t.commit();
      await updateStudentPaymentStatus(student.dataValues.id);

      res.status(200).json(student);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error("updateStudentda xatolik:", error);
    next(error);
  }
}

async function deleteStudent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const t = await sequelize.transaction();
    try {
      const student = await Student.findOne({
        where: withBranchScope(req, { id: req.params.id }),
        transaction: t,
      });
      if (!student) {
        throw BaseError.BadRequest(
          404,
          i18next.t("student_not_found", { lng: lang })
        );
      }

      const studentGroups = await StudentGroup.findAll({
        where: { student_id: student.dataValues.id },
        transaction: t,
      });

      for (const sg of studentGroups) {
        const group = await Group.findByPk(sg.dataValues.group_id, {
          transaction: t,
        });
        if (group) {
          await group.update(
            { students_amount: group.dataValues.students_amount - 1 },
            { transaction: t }
          );
        }
        await sg.destroy({ transaction: t });
      }

      await Notification.destroy({
        where: { pupil_id: student.dataValues.id },
      });
      await Appeal.destroy({ where: { pupil_id: student.dataValues.id } });
      await Payment.destroy({ where: { pupil_id: student.dataValues.id } });

      await student.destroy({ transaction: t });
      await t.commit();
      res
        .status(200)
        .json({ message: i18next.t("data_deleted", { lng: lang }) });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error("Error in deleteStudent:", error);
    next(error);
  }
}

const getMonthlyStudentStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    let branchIds: string[] | undefined;
    if (!req.scope?.all) {
      branchIds = req.scope?.branchIds;
    }
    const allStudentsByMonth = await Student.findAll({
      where: withBranchScope(req),
      attributes: [
        [fn("TO_CHAR", col("created_at"), "YYYY-MM"), "month"],
        [fn("COUNT", col("*")), "total_count"],
      ],
      group: [fn("TO_CHAR", col("created_at"), "YYYY-MM")],
      order: [[fn("TO_CHAR", col("created_at"), "YYYY-MM"), "ASC"]],
    });

    const totalTeachers = await Teacher.count({ where: withBranchScope(req) });
    const totalGroups = await Group.count({ where: withBranchScope(req) });

    const leftStudentsByMonth = await Student.findAll({
      attributes: [
        [Sequelize.literal(`TO_CHAR("left_school", 'YYYY-MM')`), "month"],
        [Sequelize.fn("COUNT", "*"), "count"],
      ],
      where: {
        left_school: { [Op.ne]: null },
      },
      group: ["month"],
      order: [[Sequelize.literal(`TO_CHAR("left_school", 'YYYY-MM')`), "ASC"]],
    });

    const currentMonth = new Date().toISOString().slice(0, 7);

    const thisMonthStatsOfStudents = await Student.findAll({
      where: withBranchScope(req),
      attributes: [
        [fn("TO_CHAR", col("created_at"), "YYYY-MM"), "month"],
        [fn("COUNT", col("*")), "total_students"],
        [
          Sequelize.literal(`
            (SELECT COUNT(*) FROM "students" s 
             WHERE TO_CHAR(s."created_at", 'YYYY-MM') <= '${currentMonth}'
             AND (s."left_school" IS NULL OR TO_CHAR(s."left_school", 'YYYY-MM') > '${currentMonth}')
            )
          `),
          "current_month_students",
        ],
        [
          Sequelize.literal(`
            (SELECT COUNT(*) FROM "students" s 
             WHERE TO_CHAR(s."left_school", 'YYYY-MM') = '${currentMonth}')
          `),
          "left_students_this_month",
        ],
      ],
      group: [fn("TO_CHAR", col("created_at"), "YYYY-MM")],
      order: [[fn("TO_CHAR", col("created_at"), "YYYY-MM"), "ASC"]],
    });

    const latestStudents = await Student.findAll({
      where: withBranchScope(req),
      order: [["created_at", "DESC"]],
      limit: 10,
      include: [
        {
          model: Group,
          as: "groups",
          attributes: ["id", "group_subject"],
          through: { attributes: [] }, // StudentGroup orqali bog'langan guruhlarni olish
          include: [
            {
              model: Teacher,
              as: "teacher",
              attributes: ["id", "first_name", "last_name"],
            },
          ],
        },
      ],
    });

    const totalStudents = await Student.findAndCountAll({ where: withBranchScope(req) });
    const totalPaymentThisMonth = await getThisMonthTotalPayments(req);
    const latestPaymentsForThisMonth = await latestPayments(req);
    const roomsBusinessPercentAll = await getRoomsBusinessPercent(branchIds);
    const studentsByGender = await Student.findAll({
      where: withBranchScope(req),
      attributes: [
        [
          Sequelize.literal(`
            COUNT(CASE WHEN "last_name" ILIKE '%va' THEN 1 END)
          `),
          "female",
        ],
        [
          Sequelize.literal(`
            COUNT(CASE WHEN "last_name" ILIKE '%v' AND "last_name" NOT ILIKE '%va' THEN 1 END)
          `),
          "male",
        ],
      ],
      raw: true,
    });
    const studentsGender = studentsByGender[0] || { male: 0, female: 0 };

    return res.status(200).json({
      totalTeachers,
      totalGroups,
      allStudentsByMonth,
      leftStudentsByMonth,
      thisMonthStatsOfStudents,
      totalPaymentThisMonth,
      latestStudents,
      latestPaymentsForThisMonth,
      totalStudents,
      roomsBusinessPercentAll: roomsBusinessPercentAll,
      studentsGender,
    });
  } catch (error) {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    next(error);
  }
};

async function updateStudentPaymentStatus(
  studentId: string,
  transaction?: any
): Promise<void> {
  try {
    const student = await Student.findByPk(studentId, {
      include: [
        {
          model: Group,
          as: "groups",
          through: { attributes: [] },
        },
      ],
      transaction,
    });

    if (!student) return;

    const currentMonth = changeMonths(new Date().getMonth() + 1);
    const currentYear = new Date().getFullYear();

    // Joriy oydagi to'liq to'lov qilingan guruhlar sonini hisoblash
    const paidGroupsCount = await StudentGroup.count({
      where: {
        student_id: studentId,
        paid: true,
        month: currentMonth,
        year: currentYear,
      },
      transaction,
    });

    // Studentning ma'lumotlarini yangilash
    await student.update(
      {
        paid_groups: paidGroupsCount,
        total_groups: student.dataValues.groups.length,
      },
      { transaction }
    );
  } catch (error) {
    console.error("To'lov holatini yangilashda xato:", error);
    throw error;
  }
}

async function getPaymentsByStudent(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  const { student_id } = req.params;
  // student_id mavjudligini tekshirish
  if (!student_id || student_id === "") {
    return res.status(400).json({
      success: false,
      message: "student_id to'g'ri kiritilmagan"
    });
  }

  try {
    const payments = await Payment.findAll({
      where: { ...withBranchScope(req), pupil_id: student_id },
      order: [['created_at', 'DESC']],
      attributes: [
        'id',
        'pupil_id',
        'payment_amount',
        'payment_type',
        'received',
        'for_which_month',
        'comment',
        'created_at',
        'shouldBeConsideredAsPaid'   // modelda camelCase yoki snake_case bo'lsa moslashtiring
      ],
      include: [
        {
          model: Group,
          as: 'paymentGroup',                                 // associationda qanday yozilgan bo'lsa
          attributes: ['group_subject'],
          include: [
            {
              model: Teacher,
              as: 'teacher',
              attributes: ['first_name', 'last_name']
            }
          ]
        }
      ]
    });

    // Frontendga mos formatda qaytarish
    const formatted = payments.map(p => ({
      id: p.dataValues.id,
      pupil_id: p.dataValues.pupil_id,
      payment_amount: p.dataValues.payment_amount,
      payment_type: p.dataValues.payment_type,
      received: p.dataValues.received,
      for_which_month: p.dataValues.for_which_month,
      comment: p.dataValues.comment,
      created_at: p.dataValues.created_at,
      shouldBeConsideredAsPaid: p.dataValues.shouldBeConsideredAsPaid,
      group: p.dataValues.paymentGroup
        ? {
          group_subject: p.dataValues.paymentGroup.group_subject,
          teacher: p.dataValues.paymentGroup.teacher
            ? `${p.dataValues.paymentGroup.teacher.first_name} ${p.dataValues.paymentGroup.teacher.last_name}`.trim()
            : null
        }
        : null
    }));

    return res.status(200).json(formatted);

  } catch (error: any) {
    console.error('getPaymentsByStudent error:', error);
    return res.status(500).json({
      success: false,
      message: "Serverda xatolik yuz berdi",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

async function getGroupAttendanceSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const { groupId } = req.params;
    const now = DateTime.now().setZone("Asia/Tashkent");

    // Guruh ma'lumotlari (dars kunlari)
    const group = await Group.findOne({
      where: withBranchScope(req, { id: groupId }),
      attributes: ['days'],
    });
    if (!group) return res.status(404).json({ error: "Guruh topilmadi" });

    const classDays = group.dataValues.days.split('-').map((d: string) => d.trim().toUpperCase());

    // Haftalik statistika
    const weekStart = now.minus({ days: 6 }).startOf('day');
    const weekEnd = now.endOf('day');

    const weekStats = await AttendanceRecord.findAll({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('AttendanceRecord.id')), 'total'],
        [
          Sequelize.fn('SUM', Sequelize.literal(`CASE WHEN "AttendanceRecord"."status" = 'present' THEN 1 ELSE 0 END`)),
          'present'
        ],
      ],
      include: [{
        model: Attendance,
        as: 'attendance',
        where: {
          group_id: groupId,
          date: { [Op.between]: [weekStart.toISODate(), weekEnd.toISODate()] }
        },
        required: true,
        attributes: ['id', 'date'],  // faqat kerakli ustunlarni olamiz
      }],
      group: ['attendance.id'],  // har bir dars (attendance) bo‘yicha guruhlash
      raw: true,
      nest: true,
    });

    let weekTotalClasses = weekStats.length;
    let weekPresent = 0;
    let weekTotalStudents = 0;

    weekStats.forEach((row: any) => {
      weekPresent += Number(row.present || 0);
      weekTotalStudents += Number(row.total || 0);
    });

    const weekPercent = weekTotalStudents > 0 ? Math.round((weekPresent / weekTotalStudents) * 100) : 0;

    // Oylik statistika
    const monthStart = now.startOf('month');
    const monthEnd = now.endOf('month');

    const monthStats = await AttendanceRecord.findAll({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('AttendanceRecord.id')), 'total'],
        [
          Sequelize.fn('SUM', Sequelize.literal(`CASE WHEN "AttendanceRecord"."status" = 'present' THEN 1 ELSE 0 END`)),
          'present'
        ],
      ],
      include: [{
        model: Attendance,
        as: 'attendance',
        where: {
          group_id: groupId,
          date: { [Op.between]: [monthStart.toISODate(), monthEnd.toISODate()] }
        },
        required: true,
        attributes: ['id', 'date'],
      }],
      group: ['attendance.id'],
      raw: true,
      nest: true,
    });

    let monthTotalClasses = monthStats.length;
    let monthPresent = 0;
    let monthTotalStudents = 0;

    monthStats.forEach((row: any) => {
      monthPresent += Number(row.present || 0);
      monthTotalStudents += Number(row.total || 0);
    });

    const monthPercent = monthTotalStudents > 0 ? Math.round((monthPresent / monthTotalStudents) * 100) : 0;

    // Natija
    res.json({
      week: {
        percent: weekPercent,
        present: weekPresent,
        total: weekTotalStudents,
        classes: weekTotalClasses,
      },
      month: {
        percent: monthPercent,
        present: monthPresent,
        total: monthTotalStudents,
        classes: monthTotalClasses,
      }
    });

  } catch (err) {
    console.error("getGroupAttendanceSummary xatosi:", err);
    next(err);
  }
}

async function makeAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const lang = "uz";
    const group_id = req.params.id as string;
    const { records, date } = req.body;

    // Validate input
    if (!records || !Array.isArray(records) || !date) {
      return next(
        BaseError.BadRequest(400, "Noto'g'ri formatdagi ma'lumot kiritildi")
      );
    }

    // Validate group
    const foundGroup = await Group.findByPk(group_id);
    if (!foundGroup) {
      return next(BaseError.BadRequest(404, "Guruh topilmadi"));
    }

    // Validate date
    const inputDate = DateTime.fromISO(date, { zone: "Asia/Tashkent" });
    const today = DateTime.now().setZone("Asia/Tashkent");
    if (inputDate > today.endOf("day")) {
      return next(
        BaseError.BadRequest(400, "Hali kelmagan sana kiritildi")
      );
    }

    // Check existing attendance
    const existing = await Attendance.findOne({
      where: { group_id, date: inputDate.toISODate() },
    });
    if (existing) {
      return next(BaseError.BadRequest(400, "Yo'qlama qilingan"));
    }

    // Class start and end time
    const [startHours, startMinutes] = foundGroup.dataValues.start_time.split(":").map(Number);
    const [endHours, endMinutes] = foundGroup.dataValues.end_time.split(":").map(Number);

    const classStart = DateTime.fromObject(
      { year: inputDate.year, month: inputDate.month, day: inputDate.day, hour: startHours, minute: startMinutes },
      { zone: "Asia/Tashkent" }
    ).minus({ minutes: 10 }); // 10 daqiqa oldin

    const classEnd = DateTime.fromObject(
      { year: inputDate.year, month: inputDate.month, day: inputDate.day, hour: endHours, minute: endMinutes },
      { zone: "Asia/Tashkent" }
    ).plus({ hours: 1 }); // 1 soat qo'shimcha

    const now = DateTime.now().setZone("Asia/Tashkent");

    // Check if admin has extended the time for this group
    const extension = await AttendanceExtension.findOne({
      where: {
        group_id,
        extended_until: { [Op.gt]: now.toISO() }
      },
      order: [['extended_until', 'DESC']] // Eng oxirgi uzaytirishni olish
    });

    // Agar uzaytirish mavjud bo'lsa, vaqt cheklovini o'tkazib yuboramiz
    if (!extension) {
      // Normal time validation faqat uzaytirish mavjud bo'lmaganda
      if (now < classStart) {
        const diff = classStart.diff(now, ["hours", "minutes"]);
        const hours = diff.hours;
        const minutes = Math.round(diff.minutes);

        return next(
          BaseError.BadRequest(
            400,
            `Dars boshlanishiga hali ${hours} soat ${minutes} daqiqa bor. Yo'qlama qilish mumkin emas.`
          )
        );
      }

      if (now > classEnd) {
        const diff = now.diff(classEnd, ["hours", "minutes"]);
        const hours = diff.hours;
        const minutes = Math.round(diff.minutes);
        return next(
          BaseError.BadRequest(
            400,
            `Dars tugagach bir soat qo'shimcha vaqtdan ${hours} soat ${minutes} daqiqa o'tdi. Yo'qlama qilish mumkin emas.`
          )
        );
      }
    }

    // Create attendance transaction
    const t = await sequelize.transaction();
    try {
      const attendance = await Attendance.create(
        {
          group_id,
          date: inputDate.toISODate(),
          extended_until: extension ? extension.dataValues.extended_until : null
        },
        { transaction: t }
      );

      for (const item of records) {
        const { student_id, status, reason, note } = item;
        if (!student_id || typeof student_id !== "string") {
          throw BaseError.BadRequest(400, "Noto'g'ri o'quvchi ID'si kiritildi");
        }

        const foundStudent = await Student.findByPk(student_id, { transaction: t });
        if (!foundStudent) {
          throw BaseError.BadRequest(404, "O'quvchi topilmadi");
        }

        if (!["present", "absent"].includes(status)) {
          throw BaseError.BadRequest(400, "Yo'qlama uchun noto'g'ri status kiritildi");
        }

        if (status === "absent" && reason && !["excused", "unexcused"].includes(reason)) {
          throw BaseError.BadRequest(400, "Yo'qlama uchun noto'g'ri sabab kiritildi");
        }

        await AttendanceRecord.create(
          {
            attendance_id: attendance.dataValues.id,
            student_id,
            status,
            reason: status === "present" ? null : reason || "unexcused",
            note: status === "present" ? null : note || null,
          },
          { transaction: t }
        );

        if (status === "present") {
          await foundStudent.update(
            { came_in_school: now.toISO() },
            { transaction: t }
          );
        }
      }

      await t.commit();
      res.status(201).json({
        message: "Yo'qlama saqlandi",
        attendanceId: attendance.dataValues.id,
      });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error: any) {
    next(error);
  }
}

async function updateAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const group_id = req.params.groupId;
    const { date, records } = req.body;

    if (!date || !records || !Array.isArray(records)) {
      return next(BaseError.BadRequest(400, "Noto'g'ri formatdagi ma'lumot kiritildi"));
    }

    const attendance = await Attendance.findOne({
      where: { group_id, date },
    });

    if (!attendance) {
      return next(BaseError.BadRequest(404, "Yo'qlama topilmadi"));
    }

    // Time validation for updates
    const now = DateTime.now().setZone("Asia/Tashkent");
    const inputDate = DateTime.fromISO(date, { zone: "Asia/Tashkent" });

    const foundGroup = await Group.findByPk(group_id);
    if (!foundGroup) {
      return next(BaseError.BadRequest(404, "Guruh topilmadi"));
    }

    const [endHours, endMinutes] = foundGroup.dataValues.end_time.split(":").map(Number);
    const classEnd = DateTime.fromObject(
      { year: inputDate.year, month: inputDate.month, day: inputDate.day, hour: endHours, minute: endMinutes },
      { zone: "Asia/Tashkent" }
    ).plus({ hours: 1 });

    // Check extension for this group
    const extension = await AttendanceExtension.findOne({
      where: {
        group_id,
        extended_until: { [Op.gt]: now.toISO() }
      },
      order: [['extended_until', 'DESC']]
    });

    // Agar uzaytirish mavjud bo'lmasa va vaqt o'tib bo'lsa, yangilashga ruxsat bermaymiz
    if (!extension && now > classEnd) {
      return next(
        BaseError.BadRequest(
          400,
          "Yo'qlama vaqti tugagan. Yangilash mumkin emas."
        )
      );
    }

    const t = await sequelize.transaction();
    try {
      for (const item of records) {
        const { student_id, status, reason, note } = item;

        if (!["present", "absent"].includes(status)) {
          throw BaseError.BadRequest(400, "Status noto'g'ri");
        }

        const existingRecord = await AttendanceRecord.findOne({
          where: {
            attendance_id: attendance.dataValues.id,
            student_id,
          },
          transaction: t,
        });

        if (existingRecord) {
          await existingRecord.update(
            {
              status,
              reason: status === "present" ? null : reason || "unexcused",
              note: status === "present" ? null : note || null,
            },
            { transaction: t }
          );
        } else {
          await AttendanceRecord.create(
            {
              attendance_id: attendance.dataValues.id,
              student_id,
              status,
              reason: status === "present" ? null : reason || "unexcused",
              note: status === "present" ? null : note || null,
            },
            { transaction: t }
          );
        }
      }

      await t.commit();
      return res.status(200).json({ message: "Yo'qlama yangilandi" });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

async function extendAttendanceTime(req: Request, res: Response, next: NextFunction) {
  try {
    const { group_id, extended_until } = req.body;

    if (!group_id || !extended_until) {
      return next(BaseError.BadRequest(400, "Guruh ID va uzaytirish vaqti kerak"));
    }

    // Guruh mavjudligini tekshirish
    const foundGroup = await Group.findByPk(group_id);
    if (!foundGroup) {
      return next(BaseError.BadRequest(404, "Guruh topilmadi"));
    }

    // Vaqtni tekshirish
    const extensionDate = DateTime.fromISO(extended_until, { zone: "Asia/Tashkent" });
    const now = DateTime.now().setZone("Asia/Tashkent");

    if (extensionDate <= now) {
      return next(BaseError.BadRequest(400, "Uzaytirish vaqti hozirgi vaqtdan keyin bo'lishi kerak"));
    }

    // Uzaytirishni yaratish yoki yangilash
    const [extension, created] = await AttendanceExtension.findOrCreate({
      where: { group_id },
      defaults: {
        group_id,
        extended_until: extensionDate.toISO()
      }
    });

    if (!created) {
      await extension.update({ extended_until: extensionDate.toISO() });
    }

    res.status(200).json({
      message: `${foundGroup.dataValues.name} guruhining uzaytirish vaqti ${extensionDate.toISO()} gacha muvaffaqiyatli uzaytirildi!`,
      extended_until: extensionDate.toISO(),
    });
  } catch (error) {
    next(error);
  }
}

async function getExtendAttendanceTime(req: Request, res: Response, next: NextFunction) {
  try {
    const group_id = req.params.groupId;
    const extension = await AttendanceExtension.findOne({
      where: { group_id },
    });
    if (!extension) {
      return next(BaseError.BadRequest(404, "Uzaytirish topilmadi"));
    }
    res.status(200).json(extension);
  } catch (error) {
    next(error);
  }
}

async function getAttendanceByDate(req: Request, res: Response, next: NextFunction) {
  try {
    const lang = "uz";
    const group_id = req.params.groupId;
    const { date } = req.query;

    if (!date || typeof date !== "string") {
      return next(
        BaseError.BadRequest(400, "Noto'g'ri sana kiritildi")
      );
    }

    const attendance = await Attendance.findOne({
      where: { group_id, date },
      include: [
        {
          model: AttendanceRecord,
          as: "records",
          include: [
            {
              model: Student,
              as: "student",
              attributes: ["id", "first_name", "last_name"],
            },
          ],
        },
      ],
    });

    if (!attendance) {
      return next(
        BaseError.BadRequest(404, "Yo'qlama topilmadi")
      );
    }

    res.status(200).json(attendance);
  } catch (err) {
    next(err);
  }
}

async function getAttendanceByTeacher(req: Request, res: Response, next: NextFunction) {
  try {
    const lang = "uz";
    const group_id = req.params.groupId;
    const { date } = req.query;

    if (!date || typeof date !== "string") {
      return next(
        BaseError.BadRequest(400, "Noto'g'ri sana kiritildi")
      );
    }

    const attendance = await Attendance.findOne({
      where: { group_id, date },
      include: [
        {
          model: AttendanceRecord,
          as: "records",
          include: [
            {
              model: Student,
              as: "student",
              attributes: ["id", "first_name", "last_name"],
            },
          ],
        },
      ],
    });

    if (!attendance) {
      return next(
        BaseError.BadRequest(404, "Yo'qlama topilmadi")
      );
    }

    res.status(200).json(attendance);
  } catch (err) {
    next(err);
  }
}

async function getTodayAttendanceStats(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const lang = "uz";
    const groupTimeZone = "Asia/Tashkent";

    // Hozirgi vaqt Luxon bilan
    const now = DateTime.now().setZone(groupTimeZone);
    const todayStr = now.toISODate(); // YYYY-MM-DD
    const dayOfWeek = now.weekday; // 1 = Dushanba ... 7 = Yakshanba
    const daysInUzbek = ["YAKSHANBA", "DUSHANBA", "SESHANBA", "CHORSHANBA", "PAYSHANBA", "JUMA", "SHANBA"];
    const todayDayName = daysInUzbek[dayOfWeek % 7]; // Luxon 1-7, biz array 0-6

    const groups = await Group.findAll({
      where: withBranchScope(req),
    });

    // Bugungi darslar uchun guruhlarni filtr qilish
    const todaysGroups = groups.filter((g) =>
      g.dataValues.days
        .split("-")
        .map((d: string) => d.trim())
        .includes(todayDayName)
    );

    if (!todaysGroups.length) {
      return res.status(200).json({
        present: 0,
        absent: 0,
        total: 0,
        percent: 0,
      });
    }

    const stats = await AttendanceRecord.findAll({
      attributes: [
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              `CASE WHEN "AttendanceRecord"."status" = 'present' THEN 1 ELSE 0 END`
            )
          ),
          "present",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              `CASE WHEN "AttendanceRecord"."status" = 'absent' THEN 1 ELSE 0 END`
            )
          ),
          "absent",
        ],
        [Sequelize.fn("COUNT", Sequelize.col("AttendanceRecord.id")), "total"],
      ],
      include: [
        {
          model: Attendance,
          as: "attendance",
          attributes: [],
          required: true,
          where: {
            group_id: { [Op.in]: todaysGroups.map((g) => g.dataValues.id) },
            date: todayStr,
          },
        },
      ],
      raw: true,
    }) as unknown as Array<{ present: number | null; absent: number | null; total: number | null }>;

    const row = stats[0] || { present: 0, absent: 0, total: 0 };
    const present = Number(row.present) || 0;
    const absent = Number(row.absent) || 0;
    const total = Number(row.total) || 0;

    const percent = total > 0 ? Math.round((present / total) * 100) : 0;

    return res.status(200).json({
      present,
      absent,
      total,
      percent,
    });
  } catch (error) {
    next(error);
  }
}

async function getOverallAttendanceStats(req: Request, res: Response, next: NextFunction) {
  try {
    const now = DateTime.now().setZone("Asia/Tashkent");

    // Hafta
    const weekStart = now.minus({ days: 6 }).startOf('day');
    const weekEnd = now.endOf('day');

    const weekStats = await AttendanceRecord.findOne({
      attributes: [
        [fn('SUM', literal(`CASE WHEN status = 'present' THEN 1 ELSE 0 END`)), 'present'],
        [fn('COUNT', col('AttendanceRecord.id')), 'total'],
      ],
      include: [{
        model: Attendance,
        as: 'attendance',
        where: { date: { [Op.between]: [weekStart.toISODate(), weekEnd.toISODate()] } },
        include: [{
          model: Group,
          as: "group",   // Attendance.belongsTo(Group, { as: ... })
          where: withBranchScope(req),
          required: true,
          attributes: [],
        }],
        required: true,
        attributes: [],
      }],
      raw: true,
    }) as any

    const weekPresent = Number(weekStats?.present || 0);
    const weekTotal = Number(weekStats?.total || 0);
    const weekPercent = weekTotal > 0 ? Math.round((weekPresent / weekTotal) * 100) : 0;

    // Oy
    const monthStart = now.startOf('month');
    const monthEnd = now.endOf('month');

    const monthStats = await AttendanceRecord.findOne({
      attributes: [
        [fn('SUM', literal(`CASE WHEN status = 'present' THEN 1 ELSE 0 END`)), 'present'],
        [fn('COUNT', col('AttendanceRecord.id')), 'total'],
      ],
      include: [{
        model: Attendance,
        as: 'attendance',
        where: { date: { [Op.between]: [monthStart.toISODate(), monthEnd.toISODate()] } },
        include: [{
          model: Group,
          as: "group",   // Attendance.belongsTo(Group, { as: ... })
          where: withBranchScope(req),
          required: true,
          attributes: [],
        }],
        required: true,
        attributes: [],
      }],
      raw: true,
    }) as any;

    const monthPresent = Number(monthStats?.present || 0);
    const monthTotal = Number(monthStats?.total || 0);
    const monthPercent = monthTotal > 0 ? Math.round((monthPresent / monthTotal) * 100) : 0;

    res.json({
      week: { percent: weekPercent, present: weekPresent, total: weekTotal },
      month: { percent: monthPercent, present: monthPresent, total: monthTotal }
    });

  } catch (err) {
    next(err);
  }
}

export {
  getStudents,
  getOneStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getMonthlyStudentStats,
  makeAttendance,
  getOneGroupStudents,
  getTodayAttendanceStats,
  getAttendanceByDate,
  updateAttendance,
  extendAttendanceTime,
  getExtendAttendanceTime,
  generateStudentId,
  getGroupAttendanceSummary,
  getOverallAttendanceStats,
  getPaymentsByStudent,
  getOneGroupStudentsForTeacher,
  getAttendanceByTeacher,
  updateStudentPaymentStatus,
  monthsInUzbek
};
