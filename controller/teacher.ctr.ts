import { NextFunction, Request, Response } from "express";
import Teacher from "../Models/teacher_model";
import { ICreateTeacherDto } from "../DTO/teacher/create_teacher_dto";
import { BaseError } from "../Utils/base_error";
import { IUpdateTeacherDto } from "../DTO/teacher/update_teacher_dto";
import i18next from "i18next";

async function getTeachers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const teachers = await Teacher.findAll();
    if (teachers.length === 0) {
      return next(
        BaseError.BadRequest(
          404,
          i18next.t("TEACHERS_NOT_FOUND", { lng: lang })
        )
      );
    }
    res.status(200).json(teachers);
  } catch (error: any) {
    next(error);
  }
}

async function getOneTeacher(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const teacher = await Teacher.findByPk(req.params.id as string);
    if (!teacher) {
      return next(BaseError.BadRequest(404, i18next.t("TEACHER_NOT_FOUND", { lng: lang })));
    }
    res.status(200).json(teacher);
  } catch (error: any) {
    next(error);
  }
}

async function createTeacher(
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
      birth_date,
      phone_number,
      subject,
      img_url,
      got_salary_for_this_month,
    } = req.body as ICreateTeacherDto;
    const teacher = await Teacher.create({
      first_name,
      last_name,
      father_name,
      birth_date,
      phone_number,
      subject,
      img_url,
      got_salary_for_this_month,
    });
    res.status(200).json(teacher);
  } catch (error: any) {
    next(error);
  }
}

async function updateTeacher(
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
      birth_date,
      phone_number,
      subject,
      img_url,
      got_salary_for_this_month,
    } = req.body as IUpdateTeacherDto;
    const teacher = await Teacher.findByPk(req.params.id as string);
    if (!teacher) {
      return next(BaseError.BadRequest(404, i18next.t("TEACHER_NOT_FOUND", { lng: lang })));
    }
    teacher.update({
      first_name,
      last_name,
      father_name,
      birth_date,
      phone_number,
      subject,
      img_url,
      got_salary_for_this_month,
    });
    res.status(200).json(teacher);
  } catch (error: any) {
    next(error);
  }
}

async function deleteTeacher(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const teacher = await Teacher.findByPk(req.params.id as string);
    if (!teacher) {
      return next(BaseError.BadRequest(404, i18next.t("TEACHER_NOT_FOUND", { lng: lang })));
    }
    teacher.destroy();
    res.status(200).json({
      message: i18next.t("DATA_DELETED", { lng: lang }),
    });
  } catch (error: any) {
    next(error);
  }
}

export {
  getTeachers,
  getOneTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
};
