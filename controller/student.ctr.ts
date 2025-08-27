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

    if (students.length === 0) {
      return next(
        BaseError.BadRequest(
          404,
          i18next.t("students_not_found", { lng: lang })
        )
      );
    }
    res.status(200).json(students);
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
      return next(
        BaseError.BadRequest(404, "Guruh topilmadi")
      );
    }

    // Validate date
    const inputDate = new Date(date);
    const today = new Date();
    if (inputDate.toISOString().split("T")[0] > today.toISOString().split("T")[0]) {
      return next(
        BaseError.BadRequest(400, "Hali kelmagan sana kiritildi")
      );
    }

    // Check class time
    const startTime = foundGroup.dataValues.start_time;
    const endTime = foundGroup.dataValues.end_time;
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);
    const classStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), startHours, startMinutes);
    classStart.setMinutes(classStart.getMinutes() - 10); // 10 minutes before
    const classEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), endHours, endMinutes);

    const currentTime = new Date();
    const TEN_MINUTES = 10 * 60 * 1000; // 10 daqiqa millisekundlarda
    const ONE_HOUR = 60 * 60 * 1000;    // 1 soat millisekundlarda
    
    const attendanceStart = classStart.getTime() - TEN_MINUTES;
    const attendanceEnd = classEnd.getTime() + ONE_HOUR;
    
    // currentTime ni raqamga aylantirish
    const now = currentTime instanceof Date ? currentTime.getTime() : currentTime;
    
    if (now < attendanceStart) {
      const minutesLeft = Math.ceil((attendanceStart - now) / (60 * 1000));
      return next(
        BaseError.BadRequest(
          400,
          `Dars boshlanishiga hali ${minutesLeft} daqiqa bor. Yo‘qlama qilish mumkin emas.`
        )
      );
    }
    
    if (now > attendanceEnd) {
      const minutesOver = Math.ceil((now - attendanceEnd) / (60 * 1000));
      return next(
        BaseError.BadRequest(
          400,
          `Dars tugagach bir soat qo‘shimcha vaqt ham ${minutesOver} daqiqa o‘tdi. Yo‘qlama qilish mumkin emas.`
        )
      );
    }

    // Check existing attendance
    const existing = await Attendance.findOne({
      where: { group_id, date },
    });
    if (existing) {
      return next(
        BaseError.BadRequest(400, "Yo'qlama qilingan")
      );
    }

    // Create attendance
    const t = await sequelize.transaction();
    try {
      const attendance = await Attendance.create(
        { group_id, date },
        { transaction: t }
      );

      // Validate and create records
      for (const item of records) {
        const { student_id, status, reason, note } = item;
        if (!student_id || typeof student_id !== "string") {
          throw BaseError.BadRequest(
            400,
            "Noto'g'ri o'quvchi ID'si kiritildi"
          );
        }

        const foundStudent = await Student.findByPk(student_id, { transaction: t });
        if (!foundStudent) {
          throw BaseError.BadRequest(
            404,
            "O'quvchi topilmadi"
          );
        }

        if (!["present", "absent"].includes(status)) {
          throw BaseError.BadRequest(
            400,
            "Yo'qlama uchun noto'g'ri status kiritildi"
          );
        }
        if (status === "absent" && reason && !["excused", "unexcused"].includes(reason)) {
          throw BaseError.BadRequest(
            400,
            "Yo'qlama uchun noto'g'ri sabab kiritildi"
          );
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
            { came_in_school: new Date().toISOString() },
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
  const daysInUzbek = ["YAKSHANBA", "DUSHANBA", "SESHANBA", "CHORSHANBA", "PAYSHANBA", "JUMA", "SHANBA"];
  try {
    const now = new Date();
    const today = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const dayOfWeek = now.getDay(); // 0 = Yakshanba, 1 = Dushanba ...
    const groups = await Group.findAll();
    const todaysGroups = groups.filter((g) =>
      g.dataValues.days.split("-").map((d: string) => d.trim()).includes(daysInUzbek[dayOfWeek])
    );
    console.log(`Todays groups: ${JSON.stringify(todaysGroups)}`);
    console.log(`Day of week: ${dayOfWeek}`);
    console.log(`Groups: ${JSON.stringify(groups)}`);

    // Valid guruhlarni filtr qilish
    const validGroupIds = todaysGroups
      .filter((g) => {
        const [sh, sm, ss] = g.dataValues.start_time.split(":").map(Number);
        const [eh, em, es] = g.dataValues.end_time.split(":").map(Number);

        const start = new Date(now);
        start.setHours(sh, sm, ss || 0, 0);

        const end = new Date(now);
        end.setHours(eh, em, es || 0, 0);

        const diffMinutes = (start.getTime() - now.getTime()) / 60000;

        return (
          (start <= now && now <= end) || // hozir dars davom etmoqda
          (diffMinutes > 0 && diffMinutes <= 10) // boshlanishiga 10 daqiqa qolgan
        );
      })
      .map((g) => g.dataValues.id);
    if (!validGroupIds.length) {
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
        [
          Sequelize.fn("COUNT", Sequelize.col("AttendanceRecord.id")),
          "total",
        ],
      ],
      include: [
        {
          model: Attendance,
          as: "attendance",
          attributes: [],
          required: true,
          where: {
            group_id: { [Op.in]: validGroupIds },
            date: today,
          },
        },
      ],
      raw: true,
    }) as unknown as Array<{ present: number | null, absent: number | null, total: number | null }>;

    const row = stats[0] || { present: 0, absent: 0, total: 0 };
    const result: AttendanceStats = {
      present: Number(row.present) || 0,
      absent: Number(row.absent) || 0,
      total: Number(row.total) || 0
    };

    return res.json(result);
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
};
