import { NextFunction, Request, Response } from "express";
import { Sequelize, col, fn, Op, where } from "sequelize";
import i18next from "../Utils/lang";
import { Student } from "../Models/index";
import { ICreateStudentDto } from "../DTO/student/create_student_dto";
import { BaseError } from "../Utils/base_error";
import { IUpdateStudentDto } from "../DTO/student/update_student_dto";
import { Teacher } from "../Models/index";
import { Group } from "../Models/index";
import Attendance from "../Models/attendance_model";
import { createNotification } from "../Utils/notification.srv";
import { getThisMonthTotalPayments, latestPayments } from "./payments.ctr";
import sequelize from "../config/database.config";
import { sendSMS } from "../Utils/sms-service";

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

async function getStudents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const students = await Student.findAll({
      include: [
        {
          model: Group,
          as: "group",
          attributes: ["id", "group_subject"],
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
    const student = await Student.findByPk(req.params.id as string);
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
    const groupId = req.query.group_id;
    if (!groupId) return res.status(400).json({ error: "group_id required" });
    const students = await Student.findAll({ where: { group_id: groupId } });
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
      group_id,
      teacher_id,
      paid_for_this_month,
      parents_phone_number,
      telegram_user_id,
      came_in_school,
      img_url,
      left_school,
    } = req.body as ICreateStudentDto;

    if (!group_id) {
      return next(
        BaseError.BadRequest(400, i18next.t("group_id_required", { lng: lang }))
      );
    }

    const t = await sequelize.transaction();
    try {
      const ReturnedId = await generateStudentId(t);
      console.log("newId in createStudent:", ReturnedId);

      const student = await Student.create(
        {
          first_name,
          last_name,
          father_name,
          mother_name,
          birth_date,
          phone_number,
          group_id,
          teacher_id,
          paid_for_this_month,
          parents_phone_number,
          telegram_user_id,
          came_in_school,
          img_url,
          left_school,
          studental_id: ReturnedId,
        },
        { transaction: t }
      );

      const group_name = await Group.findByPk(student.dataValues.group_id, {
        transaction: t,
      });
      if (!group_name) {
        throw BaseError.BadRequest(
          404,
          i18next.t("group_not_found", { lng: lang })
        );
      }

      await group_name.increment("students_amount", { by: 1, transaction: t });

      await createNotification(
        student.dataValues.id,
        i18next.t("added_to_group", {
          group_subject: group_name.dataValues.group_subject,
          lng: lang,
        }),
        { transaction: t }
      );
      await t.commit();
      const welcomeMessage = `Assalomu alaykum hurmatli ${student.dataValues.first_name} ${student.dataValues.last_name}!\nSizni o'quvchilarimiz orasida ko'rib turganimizdan juda xursandmiz!\nSizning shaxsiy ID raqamingiz: ID${student.dataValues.studental_id}\nSiz shaxsiy ID raqamingizdan foydalangan holda markazimizning @murojaat_crm_bot telegram boti orqali bizga istalgan vaqtda murojaat qilishingiz mumkin.\nO'qishlaringizda muvaffaqiyatlar tilaymiz!\n\nHurmat bilan,\n"Intellectual Progress Star" jamoasi! `;

      await sendSMS(
        student.dataValues.id,
        student.dataValues.phone_number,
        welcomeMessage
      );
      res.status(200).json(student);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error("Error in createStudent:", error);
    next(error);
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
      group_id,
      teacher_id,
      paid_for_this_month,
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
    await student.update({
      first_name,
      last_name,
      father_name,
      mother_name,
      birth_date,
      phone_number,
      group_id,
      teacher_id,
      paid_for_this_month,
      parents_phone_number,
      telegram_user_id,
      came_in_school,
      img_url,
      left_school,
    });
    res.status(200).json(student);
  } catch (error: any) {
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

      const group_name = await Group.findByPk(student.dataValues.group_id, {
        transaction: t,
      });
      if (!group_name) {
        throw BaseError.BadRequest(
          404,
          i18next.t("group_not_found", { lng: lang })
        );
      }

      await group_name.increment("students_amount", { by: -1, transaction: t });

      await createNotification(
        student.dataValues.id,
        i18next.t("removed_from_group", {
          first_name: student.dataValues.first_name,
          lng: lang,
        }),
        { transaction: t }
      );

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
          as: "group",
          attributes: ["id", "group_subject"],
        },
        {
          model: Teacher,
          as: "teacher",
          attributes: ["id", "first_name", "last_name"],
        },
      ],
    });
    const totalStudents = await Student.findAndCountAll();
    const totalPaymentThisMonth = await getThisMonthTotalPayments();
    const latestPaymentsForThisMonth = await latestPayments();

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
    });
  } catch (error) {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    next(error);
  }
};

async function makeAttendance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = "uz";
    let group_subject_id = req.params.id as string;
    let { attendanceBody } = req.body;
    const date = new Date(2025, 2, 1);
    const formattedDate = date.toLocaleDateString(`uz-UZ`, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    let foundGroup = await Group.findByPk(group_subject_id);
    if (!foundGroup) {
      return next(
        BaseError.BadRequest(404, i18next.t("group_not_found", { lng: lang }))
      );
    }
    interface student_id {
      student_id: string;
      attendance: string;
    }

    const attendance_res: student_id[] = [];

    let startTime = foundGroup.dataValues.start_time;
    let endTime = foundGroup.dataValues.end_time;
    let now = new Date();
    let timeNow = now.toTimeString().split(" ")[0];
    if (timeNow > endTime || timeNow < startTime) {
      return next(
        BaseError.BadRequest(
          400,
          i18next.t("class_not_available", { lng: lang })
        )
      );
    }
    for (const item of attendanceBody) {
      const foundStudent = await Student.findByPk(item.studentId);
      if (!foundStudent) {
        return next(
          BaseError.BadRequest(
            400,
            req.t("student_id_not_found", { studentId: item.studentId })
          )
        );
      }
      if (item.present) {
        foundStudent.update({ came_in_school: new Date().toISOString() });
        attendance_res.push({ student_id: item.studentId, attendance: "came" });
      } else {
        attendance_res.push({ student_id: item.studentId, attendance: "not" });
        // await createNotification(
        //   item.studentId,
        //   req.t("absent_notification", {
        //     date: formattedDate,
        //     startTime: startTime.slice(0, 5),
        //     endTime: endTime.slice(0, 5),
        //     lng: lang,
        //     interpolation: { escapeValue: false },
        //   })
        // );
      }
    }
    const attend = await Attendance.create({
      group_id: group_subject_id,
      came_students: attendance_res,
    });
    res.status(201).json(attend);
  } catch (error: any) {
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
};
