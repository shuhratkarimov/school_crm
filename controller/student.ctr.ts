import { NextFunction, Request, Response } from "express";
import { Sequelize, col, fn, Op, where } from "sequelize";
import i18next from "../Utils/lang";
import Student from "../Models/student_model";
import { ICreateStudentDto } from "../DTO/student/create_student_dto";
import { BaseError } from "../Utils/base_error";
import { IUpdateStudentDto } from "../DTO/student/update_student_dto";
import Teacher from "../Models/user_model";
import Group from "../Models/group_model";
import Attendance from "../Models/attendance_model";
import { createNotification } from "../Utils/notification.srv";


async function getStudents(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const students = await Student.findAll();
    if (students.length === 0) {
      return next(BaseError.BadRequest(404, i18next.t("students_not_found", { lng: lang })));
    }
    res.status(200).json(students);
  } catch (error: any) {
    next(error);
  }
}

async function getOneStudent(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const student = await Student.findByPk(req.params.id as string);
    if (!student) {
      return next(BaseError.BadRequest(404, i18next.t("student_not_found", { lng: lang })));
    }
    res.status(200).json(student);
  } catch (error) {
    next(error);
  }
}

async function createStudent(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
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
    const student = await Student.create({
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
    const group_name = await Group.findByPk(student.dataValues.group_id);
    await createNotification(
      student.dataValues.id,
      i18next.t("added_to_group", { group_subject: group_name?.dataValues.group_subject, lng: lang })
    );
    res.status(200).json(student);
  } catch (error: any) {
    next(error);
  }
}

async function updateStudent(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
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
      return next(BaseError.BadRequest(404, i18next.t("student_not_found", { lng: lang })));
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

async function deleteStudent(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const student = await Student.findByPk(req.params.id as string);
    if (!student) {
      return next(BaseError.BadRequest(404, i18next.t("student_not_found", { lng: lang })));
    }
    await createNotification(
      student.dataValues.id,
      req.t("removed_from_group", { first_name: student.dataValues.first_name })
    );
    await student.destroy();
    res.status(200).json({ message: i18next.t("data_deleted", { lng: lang }) });
  } catch (error: any) {
    next(error);
  }
}

const getMonthlyStudentStats = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
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
        (SELECT COUNT(*) FROM "Students" s 
         WHERE TO_CHAR(s."created_at", 'YYYY-MM') <= '${currentMonth}'
         AND (s."left_school" IS NULL OR TO_CHAR(s."left_school", 'YYYY-MM') > '${currentMonth}')
        )
      `),
          "current_month_students",
        ],
        [
          Sequelize.literal(`
        (SELECT COUNT(*) FROM "Students" s 
         WHERE TO_CHAR(s."left_school", 'YYYY-MM') = '${currentMonth}')
      `),
          "left_students_this_month",
        ],
      ],
      group: [fn("TO_CHAR", col("created_at"), "YYYY-MM")],
      order: [[fn("TO_CHAR", col("created_at"), "YYYY-MM"), "ASC"]],
    });

    return res.status(200).json({
      totalTeachers,
      totalGroups,
      allStudentsByMonth,
      leftStudentsByMonth,
      thisMonthStatsOfStudents,
    });
  } catch (error) {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    next(error);
    return res.status(500).json({ message: i18next.t("server_error", { lng: lang }) });
  }
};

async function makeAttendance(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
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
      return next(BaseError.BadRequest(404, i18next.t("group_not_found", { lng: lang })));
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
      return next(BaseError.BadRequest(400, i18next.t("class_not_available", { lng: lang })));
    }
    for (const item of attendanceBody) {
      const foundStudent = await Student.findByPk(item.studentId);
      if (!foundStudent) {
        return next(
          BaseError.BadRequest(400, req.t("student_id_not_found", { studentId: item.studentId }))
        );
      }
      if (item.present) {
        foundStudent.update({ came_in_school: new Date().toISOString() });
        attendance_res.push({ student_id: item.studentId, attendance: "came" });
      } else {
        attendance_res.push({ student_id: item.studentId, attendance: "not" });
        await createNotification(
          item.studentId,
          req.t("absent_notification", {
            date: formattedDate,
            startTime: startTime.slice(0, 5),
            endTime: endTime.slice(0, 5),
            lng: lang,
            interpolation: { escapeValue: false },
          })
        );
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
};