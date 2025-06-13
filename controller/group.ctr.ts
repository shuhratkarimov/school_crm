import { NextFunction, Request, Response } from "express";
import { ICreateGroupDto } from "../DTO/group/create_group_dto";
import { BaseError } from "../Utils/base_error";
import { IUpdateGroupDTO } from "../DTO/group/update_group_dto";
import Student from "../Models/student_model";
import i18next from "../Utils/lang";
import {Teacher, Group} from "../Models/index"

async function getGroups(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"] || "uz";
    const groups = await Group.findAll({
      include: [
        {
          model: Teacher,
          as: "teacher",
          attributes: ['id', 'first_name', 'last_name', 'phone_number', 'subject'],
        }
      ]
    });

    if (groups.length === 0) {
      return next(BaseError.BadRequest(404, i18next.t("groups_not_found", { lng: lang })));
    }

    res.status(200).json(groups);
  } catch (error: any) {
    next(error);
  }
}

async function getOneGroup(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"] || "uz";
    const group = await Group.findByPk(req.params.id as string);

    if (!group) {
      return next(BaseError.BadRequest(404, i18next.t("group_not_found", { lng: lang })));
    }

    const studentInThisGroup = await Student.findAll({ where: { group_id: group.dataValues.id } });

    res.status(200).json({ group, studentInThisGroup });
  } catch (error) {
    next(error);
  }
}

async function createGroup(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"] || "uz";

    const {
      group_subject,
      days,
      start_time,
      end_time,
      teacher_id,
      teacher_phone,
      img_url,
      students_amount,
      paid_students_amount,
      monthly_fee
    } = req.body as ICreateGroupDto;

    const group = await Group.create({
      group_subject,
      days,
      start_time,
      end_time,
      teacher_id,
      teacher_phone,
      students_amount,
      paid_students_amount,
      monthly_fee
    });

    res.status(201).json({
      message: i18next.t("group_created", { lng: lang }),
      group,
    });
  } catch (error: any) {
    next(error);
  }
}

async function updateGroup(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"] || "uz";

    const {
      group_subject,
      days,
      start_time,
      end_time,
      teacher_id,
      teacher_phone,
      students_amount,
      paid_students_amount,
      monthly_fee
    } = req.body as IUpdateGroupDTO;

    const group = await Group.findByPk(req.params.id as string);

    if (!group) {
      return next(BaseError.BadRequest(404, i18next.t("group_not_found", { lng: lang })));
    }

    await group.update({
      group_subject,
      days,
      start_time,
      end_time,
      teacher_id,
      teacher_phone,
      students_amount,
      paid_students_amount,
      monthly_fee
    });

    res.status(200).json({
      message: i18next.t("group_updated", { lng: lang }),
      group,
    });
  } catch (error: any) {
    next(error);
  }
}

async function deleteGroup(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"] || "uz";
    const group = await Group.findByPk(req.params.id as string);

    if (!group) {
      return next(BaseError.BadRequest(404, i18next.t("group_not_found", { lng: lang })));
    }

    await group.destroy();

    res.status(200).json({
      message: i18next.t("group_deleted", { lng: lang }),
    });
  } catch (error: any) {
    next(error);
  }
}

export { getGroups, getOneGroup, createGroup, updateGroup, deleteGroup };
