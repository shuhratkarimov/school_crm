import { NextFunction, Request, Response } from "express";
import { Sequelize, col, fn, Op } from "sequelize";
import i18next from "../Utils/lang";
import { Appeal, Notification, Payment, Student } from "../Models/index";
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

    // Query param sifatida month va year olish (ixtiyoriy)
    const month = (req.query.month as string) || currentMonth;
    const year = parseInt(req.query.year as string) || currentYear;

    const students = await Student.findAll({
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
            },
          ],
        },
        {
          model: StudentGroup,
          as: "studentGroups",
          attributes: ["group_id", "paid", "month", "year"],
          required: false,
        },
      ],
    });

    // Har bir student uchun total_groups va paid_groups ni hisoblash
    const studentsWithGroups = students.map(student => {
      const allGroups = student.dataValues.groups.length;
      const studentGroups = student.dataValues.studentGroups.filter((sg: any) => sg.month === month && sg.year === year);
      const totalGroups = studentGroups.length;
      const paidGroups = studentGroups.filter((sg: any) => sg.paid).length;
      return {
        ...student.dataValues,
        total_groups: totalGroups, // Dinamik hisoblanadi
        paid_groups: paidGroups,  // Dinamik hisoblanadi
        all_groups: allGroups,
      };
    });

    if (studentsWithGroups.length === 0) {
      return next(BaseError.BadRequest(404, i18next.t("students_not_found", { lng: lang })));
    }
    res.status(200).json(studentsWithGroups);
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
    const student = await Student.findByPk(req.params.id as string, {
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
      include: [
        {
          model: StudentGroup,
          as: "studentGroups",
          where: { group_id: groupId },
          attributes: [],
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

    // Validate group_ids
    if (!group_ids || !Array.isArray(group_ids) || group_ids.length === 0) {
      return next(
        BaseError.BadRequest(
          400,
          i18next.t("group_ids_required", { lng: lang })
        )
      );
    }

    // Start transaction
    const t = await sequelize.transaction();
    let student; // Declare student variable
    try {
      const ReturnedId = await generateStudentId(t);

      // Create student
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
        },
        { transaction: t }
      );

      const currentDate = new Date();
      const month = changeMonths(currentDate.getMonth() + 1);
      const year = currentDate.getFullYear();

      // Add student to groups
      for (const group_id of group_ids) {
        const studentGroup = await StudentGroup.create(
          {
            student_id: student.dataValues.id,
            group_id,
            month,
            year,
          },
          { transaction: t }
        );

        const group_name = await Group.findByPk(group_id, {
          transaction: t,
        });
        if (!group_name) {
          throw BaseError.BadRequest(
            404,
            i18next.t("group_not_found", { lng: lang })
          );
        }
        await group_name.increment("students_amount", {
          by: 1,
          transaction: t,
        });

        // Uncomment if notifications are needed
        // await createNotification(
        //   student.dataValues.id,
        //   i18next.t("added_to_group", {
        //     group_subject: group_name.dataValues.group_subject,
        //     lng: lang,
        //   }),
        //   { transaction: t }
        // );
      }

      await t.commit(); // Commit transaction
    } catch (error) {
      await t.rollback(); // Rollback transaction on error
      throw error;
    }

    // Non-transactional operations
    try {
      await updateStudentPaymentStatus(student.dataValues.id);

      const welcomeMessage = `Assalomu alaykum hurmatli ${student.dataValues.first_name} ${student.dataValues.last_name}!\nSizni o'quvchilarimiz orasida ko'rib turganimizdan juda xursandmiz!\nSizning shaxsiy ID raqamingiz: ID${student.dataValues.studental_id}\nSiz shaxsiy ID raqamingizdan foydalangan holda markazimizning @murojaat_crm_bot telegram boti orqali bizga istalgan vaqtda murojaat qilishingiz mumkin.\nO'qishlaringizda muvaffaqiyatlar tilaymiz!\n\nHurmat bilan,\n"Intellectual Progress Star" jamoasi!`;

      // Uncomment if SMS sending is implemented
      // await sendSMS(
      //   student.dataValues.id,
      //   student.dataValues.phone_number,
      //   welcomeMessage
      // );

      return res.status(200).json(student);
    } catch (error) {
      // Handle errors for non-transactional operations
      console.error("Tranzaksion bo'lmagan operatsiyada xatolik", error);
      return next(error);
    }
  } catch (error: any) {
    console.error("createStudentda xatolik", error);
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

    const student = await Student.findByPk(req.params.id as string);
    if (!student) {
      return next(
        BaseError.BadRequest(404, i18next.t("student_not_found", { lng: lang }))
      );
    }

    const t = await sequelize.transaction();
    try {
      // Update student details
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

        const existingGroupIds = existingStudentGroups.map(
          (sg) => sg.dataValues.group_id
        );
        const newGroupIds = group_ids.filter(
          (id) => !existingGroupIds.includes(id)
        );
        const removedGroupIds = existingGroupIds.filter(
          (id) => !group_ids.includes(id)
        );

        const currentDate = new Date();
        const month = changeMonths(currentDate.getMonth() + 1);
        const year = currentDate.getFullYear();

        // Remove old groups
        for (const groupId of removedGroupIds) {
          const group = await Group.findByPk(groupId, { transaction: t });
          if (group) {
            await group.increment("students_amount", {
              by: -1,
              transaction: t,
            });
          }
          await StudentGroup.destroy({
            where: { student_id: student.dataValues.id, group_id: groupId },
            transaction: t,
          });
        }

        // Add new groups with current month and year
        for (const group_id of newGroupIds) {
          const group = await Group.findByPk(group_id, { transaction: t });
          if (!group) {
            throw BaseError.BadRequest(
              404,
              i18next.t("group_not_found", { lng: lang })
            );
          }
          await StudentGroup.create(
            {
              student_id: student.dataValues.id,
              group_id,
              month,
              year,
              paid: false,
            },
            { transaction: t }
          );
          await group.increment("students_amount", { by: 1, transaction: t });
        }

        // Update total_groups
        await student.update(
          {
            total_groups: group_ids.length,
          },
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
    console.error("Error in updateStudent:", error);
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
      const student = await Student.findByPk(req.params.id as string, {
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
    const allStudentsByMonth = await Student.findAll({
      attributes: [
        [fn("TO_CHAR", col("created_at"), "YYYY-MM"), "month"],
        [fn("COUNT", col("*")), "total_count"],
      ],
      group: [fn("TO_CHAR", col("created_at"), "YYYY-MM")],
      order: [[fn("TO_CHAR", col("created_at"), "YYYY-MM"), "ASC"]],
    });

    const totalTeachers = await Teacher.count();
    const totalGroups = await Group.count();

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

    const totalStudents = await Student.findAndCountAll();
    const totalPaymentThisMonth = await getThisMonthTotalPayments();
    const latestPaymentsForThisMonth = await latestPayments();
    const roomsBusinessPercentAll = await getRoomsBusinessPercent();
    const studentsByGender = await Student.findAll({
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
    console.log(currentMonth);
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

    const groups = await Group.findAll();

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
};
