import { NextFunction, Request, Response } from "express";
import { BaseError } from "../Utils/base_error";
import Student from "../Models/student_model";
import i18next from "../Utils/lang";
import Center from "../Models/center_model";
import { ICreateCenterDto } from "../DTO/center/create_center_dto";
import { IUpdateCenterDTO } from "../DTO/center/update_center_dto";
import User from "../Models/user_model";
import Teacher from "../Models/teacher_model";
import Group from "../Models/group_model";

async function getCenters(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"] || "uz";
    const centers = await Center.findAll();

    if (centers.length === 0) {
      return next(
        BaseError.BadRequest(404, i18next.t("centers_not_found", { lng: lang }))
      );
    }

    res.status(200).json(centers);
  } catch (error: any) {
    next(error);
  }
}

async function getOneCenter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"] || "uz";
    const center = await Center.findByPk(req.params.id as string);

    if (!center) {
      return next(
        BaseError.BadRequest(404, i18next.t("center_not_found", { lng: lang }))
      );
    }

    res.status(200).json(center);
  } catch (error) {
    next(error);
  }
}

async function createCenter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"] || "uz";

    const {
      name,
      address,
      owner,
      phone,
      login,
      password,
      paymentDate,
      status,
    } = req.body as ICreateCenterDto;

    const center = await Center.create({
      name,
      address,
      owner,
      phone,
      login,
      password,
      paymentDate,
      status,
    });

    res.status(201).json({
      message: i18next.t("center_created", { lng: lang }),
      center,
    });
  } catch (error: any) {
    next(error);
  }
}

async function updateCenter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"] || "uz";

    const {
      name,
      address,
      owner,
      phone,
      login,
      password,
      paymentDate,
      status,
    } = req.body as IUpdateCenterDTO;

    const center = await Center.findByPk(req.params.id as string);

    if (!center) {
      return next(
        BaseError.BadRequest(404, i18next.t("center_not_found", { lng: lang }))
      );
    }

    await center.update({
      name,
      address,
      owner,
      phone,
      login,
      password,
      paymentDate,
      status,
    });

    res.status(200).json({
      message: i18next.t("center_updated", { lng: lang }),
      center,
    });
  } catch (error: any) {
    next(error);
  }
}

async function deleteCenter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"] || "uz";
    const center = await Center.findByPk(req.params.id as string);

    if (!center) {
      return next(
        BaseError.BadRequest(404, i18next.t("center_not_found", { lng: lang }))
      );
    }

    await center.destroy();

    res.status(200).json({
      message: i18next.t("center_deleted", { lng: lang }),
    });
  } catch (error: any) {
    next(error);
  }
}

async function getStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"] || "uz";
    const center = await Center.findAll();
    const users = await User.findAll();
    const students = await Student.findAll();
    const teachers = await Teacher.findAll();
    const groups = await Group.findAll();
    const unpaidCenters = await Center.findAll({where: {status: "blocked"}})

    res.status(200).json({
      message: {
        centers: center.length,
        users: users.length,
        students: students.length,
        teachers: teachers.length,
        groups: groups.length,
        unpaidCenters: unpaidCenters.length
      },
    });
  } catch (error: any) {
    next(error);
  }
}

export { getCenters, getOneCenter, createCenter, updateCenter, deleteCenter, getStats };
