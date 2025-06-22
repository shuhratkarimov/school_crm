import { NextFunction, Request, Response } from "express";
import { ICreateGroupDto } from "../DTO/group/create_group_dto";
import { BaseError } from "../Utils/base_error";
import { IUpdateGroupDTO } from "../DTO/group/update_group_dto";
import i18next from "../Utils/lang";
import { Teacher, Group, Room, Payment, Student, Schedule } from "../Models/index";
import { Op } from "sequelize";
import { validate as uuidValidate } from "uuid";
import StudentGroup from "../Models/student_groups_model";

async function getGroups(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const lang = "uz";
    const groups = await Group.findAll({
      include: [
        {
          model: Teacher,
          as: "teacher",
          attributes: ["id", "first_name", "last_name", "phone_number", "subject"],
        },
        {
          model: Schedule,
          as: "groupSchedules", // Yangi alias
          include: [{ model: Room, as: "room", attributes: ["id", "name"] }],
        },
        {
          model: Room,
          as: "room",
          attributes: ["id", "name", "capacity"],
        },
      ],
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
    const lang = "uz";
    const group = await Group.findByPk(req.params.id as string, {
      include: [
        {
          model: Teacher,
          as: "teacher",
          attributes: ["id", "first_name", "last_name", "phone_number", "subject"],
        },
        {
          model: Schedule,
          as: "groupSchedules", // Yangi alias
          include: [{ model: Room, as: "room", attributes: ["id", "name"] }],
        },
      ],
    });

    if (!group) {
      return next(BaseError.BadRequest(404, i18next.t("group_not_found", { lng: lang })));
    }

    // StudentGroup orqali guruhga bog'langan o'quvchilarni olish
    const studentsInThisGroup = await Student.findAll({
      include: [
        {
          model: StudentGroup,
          as: "studentGroups",
          where: { group_id: group.dataValues.id },
          attributes: [],
        },
      ],
    });

    res.status(200).json({ group, studentsInThisGroup });
  } catch (error) {
    next(error);
  }
}

async function createGroup(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const lang = "uz";

    const {
      group_subject,
      days,
      start_time,
      end_time,
      teacher_id,
      monthly_fee,
      room_id,
    } = req.body as ICreateGroupDto;

    // Validatsiya
    if (!group_subject || !teacher_id || !room_id || !days || !start_time || !end_time) {
      return next(BaseError.BadRequest(400, i18next.t("missing_parameters", { lng: lang })));
    }

    // UUID formatini tekshirish
    if (!uuidValidate(room_id) || !uuidValidate(teacher_id)) {
      return next(BaseError.BadRequest(400, i18next.t("invalid_uuid_format", { lng: lang })));
    }

    const room = await Room.findByPk(room_id);
    if (!room) {
      return next(BaseError.BadRequest(404, i18next.t("room_not_found", { lng: lang })));
    }

    const teacher = await Teacher.findByPk(teacher_id);
    if (!teacher) {
      return next(BaseError.BadRequest(404, i18next.t("teacher_not_found", { lng: lang })));
    }
    
    const parsedDays = days.split("-").map(item => item.toUpperCase());
    
    for (const day of parsedDays) {
      const conflictingSchedules = await Schedule.findAll({
        where: {
          room_id,
          day,
          [Op.and]: [
            { start_time: { [Op.lt]: end_time } },
            { end_time: { [Op.gt]: start_time } },
          ],
        },
      });

      if (conflictingSchedules.length > 0) {
        return next(BaseError.BadRequest(400, i18next.t("room_conflict", { lng: lang })));
      }
    }

    // Guruh yaratish
    const group = await Group.create({
      group_subject,
      days: parsedDays.join("-"), // O'zbekcha kunlarni saqlash uchun
      start_time,
      end_time,
      teacher_id,
      monthly_fee,
      room_id,
    });

    // Jadval yozuvlarini yaratish
    for (const day of parsedDays) {
      await Schedule.create({
        room_id,
        group_id: group.dataValues.id,
        teacher_id,
        day,
        start_time,
        end_time,
      });
    }

    res.status(201).json({
      message: i18next.t("group_created", { lng: lang }),
      group,
    });
  } catch (error: any) {
    console.error("Create group error:", error);
    next(error);
  }
}

async function updateGroup(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const lang = "uz";

    const {
      group_subject,
      days,
      start_time,
      end_time,
      teacher_id,
      room_id,
      monthly_fee,
    } = req.body as IUpdateGroupDTO;

    const group = await Group.findByPk(req.params.id as string);

    if (!group) {
      return next(BaseError.BadRequest(404, i18next.t("group_not_found", { lng: lang })));
    }

    if (room_id && days && start_time && end_time) {
      if (!uuidValidate(room_id) || (teacher_id && !uuidValidate(teacher_id))) {
        return next(BaseError.BadRequest(400, i18next.t("invalid_uuid_format", { lng: lang })));
      }

      const room = await Room.findByPk(room_id);
      if (!room) {
        return next(BaseError.BadRequest(404, i18next.t("room_not_found", { lng: lang })));
      }
      
      const parsedDays = days.split("-");

      // Vaqt to‘qnashuvini tekshirish (o‘z guruhini hisobga olmagan holda)
      for (const day of parsedDays) {
        const conflictingSchedules = await Schedule.findAll({
          where: {
            room_id,
            day,
            [Op.and]: [
              { start_time: { [Op.lt]: end_time } },
              { end_time: { [Op.gt]: start_time } },
            ],
            group_id: { [Op.ne]: group.dataValues.id },
          },
        });

        if (conflictingSchedules.length > 0) {
          return next(BaseError.BadRequest(400, i18next.t("room_conflict", { lng: lang })));
        }
      }

      // Eski jadvalni o‘chirish va yangisini yaratish
      await Schedule.destroy({ where: { group_id: group.dataValues.id } });
      for (const day of parsedDays) {
        await Schedule.create({
          room_id,
          group_id: group.dataValues.id,
          teacher_id: teacher_id || group.dataValues.teacher_id,
          day,
          start_time,
          end_time,
        });
      }
    }

    await group.update({
      group_subject,
      days: days,
      start_time,
      end_time,
      teacher_id,
      room_id,
      monthly_fee,
    });

    res.status(200).json({
      message: i18next.t("group_updated", { lng: lang }),
      group,
    });
  } catch (error: any) {
    console.error("Update group error:", error);
    next(error);
  }
}

async function deleteGroup(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const lang = "uz";
    const group = await Group.findByPk(req.params.id as string);

    if (!group) {
      return next(BaseError.BadRequest(404, i18next.t("group_not_found", { lng: lang })));
    }

    await Schedule.destroy({ where: { group_id: group.dataValues.id } });
    await StudentGroup.destroy({ where: { group_id: group.dataValues.id } });
    await Payment.destroy({ where: { pupil_id: group.dataValues.id } });
    await group.destroy();

    res.status(200).json({
      message: i18next.t("group_deleted", { lng: lang }),
    });
  } catch (error: any) {
    next(error);
  }
}

export { getGroups, getOneGroup, createGroup, updateGroup, deleteGroup };