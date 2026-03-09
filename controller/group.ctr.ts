import { NextFunction, Request, Response } from "express";
import { ICreateGroupDto } from "../DTO/group/create_group_dto";
import { BaseError } from "../Utils/base_error";
import { IUpdateGroupDTO } from "../DTO/group/update_group_dto";
import i18next from "../Utils/lang";
import {
  Teacher,
  Group,
  Room,
  Payment,
  Student,
  Schedule,
} from "../Models/index";
import { Op } from "sequelize";
import { validate as uuidValidate } from "uuid";
import StudentGroup from "../Models/student_groups_model";
import sequelize from '../config/database.config';
import { ReserveStudent } from "../Models/reserve_student_model";
import { generateStudentId, monthsInUzbek, updateStudentPaymentStatus } from "./student.ctr";
import { withBranchScope } from "../Utils/branch_scope.helper";

async function approveReserveStudent(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const { group_ids = [] } = req.body;

  try {
    const reserve = await ReserveStudent.findOne({
      where: withBranchScope(req, { id }),
    });

    if (!reserve) {
      return next(
        BaseError.BadRequest(404, "Zaxiradagi o'quvchi topilmadi (yoki ruxsat yo'q)")
      );
    }

    const ReturnedId = await generateStudentId();

    await sequelize.transaction(async (t) => {
      let safeGroupIds: string[] = [];

      if (group_ids.length > 0) {
        const allowedGroups = await Group.findAll({
          where: withBranchScope(req, { id: { [Op.in]: group_ids } }),
          attributes: ["id", "group_subject"],
          transaction: t,
        });

        const allowedIds = new Set(
          allowedGroups.map((g: any) => String(g.get("id")))
        );

        safeGroupIds = group_ids.filter((gid: string) => allowedIds.has(String(gid)));

        if (safeGroupIds.length !== group_ids.length) {
          throw BaseError.BadRequest(403, "Group ro'yxatida ruxsatsiz guruh bor");
        }
      }

      const newStudent = await Student.create(
        {
          first_name: reserve.dataValues.first_name,
          last_name: reserve.dataValues.last_name,
          father_name: reserve.dataValues.father_name,
          mother_name: reserve.dataValues.mother_name,
          birth_date: reserve.dataValues.birth_date,
          phone_number: reserve.dataValues.phone_number,
          parents_phone_number: reserve.dataValues.parents_phone_number,
          came_in_school: reserve.dataValues.came_in_school,
          studental_id: ReturnedId,
          branch_id: reserve.dataValues.branch_id,
          total_groups: safeGroupIds.length,
          paid_groups: 0,
        },
        { transaction: t }
      );

      if (safeGroupIds.length > 0) {
        const currentYear = new Date().getFullYear();
        const currentMonthIndex = new Date().getMonth() + 1;

        const monthsToCreate: string[] = [];
        for (let m = currentMonthIndex; m <= 12; m++) {
          monthsToCreate.push(monthsInUzbek[m]);
        }

        for (const gid of safeGroupIds) {
          for (const month of monthsToCreate) {
            await StudentGroup.findOrCreate({
              where: {
                student_id: newStudent.dataValues.id,
                group_id: gid,
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
            where: withBranchScope(req, { id: gid }),
            transaction: t,
          });

          if (group) {
            await group.increment("students_amount", { by: 1, transaction: t });
          }
        }
      }

      await reserve.destroy({ transaction: t });

      await updateStudentPaymentStatus(newStudent.dataValues.id);
    });

    return res.status(200).json({
      success: true,
      message: "O'quvchi students jadvaliga o'tkazildi va guruh(lar)ga biriktirildi",
    });
  } catch (err) {
    next(err);
  }
}

const createReserveStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scope = (req as any).scope;
    const branch_id = scope?.all ? req.body.branch_id : scope.branchIds?.[0];
    if (!branch_id) return next(BaseError.BadRequest(400, "branch_id required"));

    const {
      first_name,
      last_name,
      father_name,
      mother_name,
      birth_date,
      phone_number,
      parents_phone_number,
      came_in_school,
      notes,
    } = req.body;

    // Majburiy maydonlarni tekshirish
    if (!first_name?.trim() || !last_name?.trim() || !phone_number || !parents_phone_number) {
      return next(BaseError.BadRequest(400, "Majburiy maydonlar to'ldirilmagan (ism, familiya, telefonlar)"));
    }

    const newStudent = await ReserveStudent.create({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      father_name: father_name?.trim(),
      mother_name: mother_name?.trim(),
      birth_date: birth_date ? new Date(birth_date) : null,
      phone_number,
      parents_phone_number,
      came_in_school: came_in_school ? new Date(came_in_school) : null,
      notes: notes?.trim(),
      status: "new",
      created_at: new Date(),
      branch_id
    });

    res.status(201).json({
      message: "Yangi o'quvchi zaxiraga qo'shildi",
      student: newStudent,
    });
  } catch (err) {
    next(err);
  }
};

export const importStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body || !req.body.students) {
      return next(BaseError.BadRequest(400, "students maydoni majburiy"));
    }

    if (!Array.isArray(req.body.students)) {
      return next(BaseError.BadRequest(400, "students massiv bo'lishi kerak"));
    }

    const students = req.body.students;

    const created = [];

    await sequelize.transaction(async (t) => {
      for (const data of students) {
        // Telefon unique tekshirish
        const existing = await Promise.all([
          ReserveStudent.findOne({ where: { phone_number: data.phone_number }, transaction: t }),
          Student.findOne({ where: { phone_number: data.phone_number }, transaction: t }),
        ]);

        const reserveStudent = await ReserveStudent.create(
          {
            first_name: data.first_name,
            last_name: data.last_name,
            father_name: data.father_name,
            mother_name: data.mother_name,
            birth_date: data.birth_date ? new Date(data.birth_date) : null,
            phone_number: data.phone_number,
            parents_phone_number: data.parents_phone_number,
            came_in_school: data.came_in_school ? new Date(data.came_in_school) : null,
            status: 'new',
          },
          { transaction: t }
        );

        created.push(reserveStudent);
      }
    });

    res.status(201).json({
      message: `${created.length} ta o'quvchi zaxiraga qo'shildi`,
      count: created.length,
    });
  } catch (err) {
    next(err);
  }
};

export const getReserveStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const students = await ReserveStudent.findAll({
      where: withBranchScope(req),
      order: [["created_at", "DESC"]],
    });
    res.status(200).json(students);
  } catch (err) {
    next(err);
  }
};

export const updateReserveStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const student = await ReserveStudent.findOne({
      where: withBranchScope(req, { id }),
    });
    if (!student) return next(BaseError.BadRequest(404, "Topilmadi (yoki ruxsat yo'q)"));

    // Agar telefon o'zgartirilsa, unique tekshirish
    if (data.phone_number && data.phone_number !== student.dataValues.phone_number) {
      const existing = await ReserveStudent.findOne({ where: { phone_number: data.phone_number } });
      if (existing) {
        return next(BaseError.BadRequest(409, `Telefon allaqachon mavjud: ${data.phone_number}`));
      }
    }

    await student.update({
      ...data,
      birth_date: data.birth_date ? new Date(data.birth_date) : student.dataValues.birth_date,
      came_in_school: data.came_in_school ? new Date(data.came_in_school) : student.dataValues.came_in_school,
    });

    res.status(200).json({
      message: "Ma'lumotlar yangilandi",
      student,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteReserveStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const student = await ReserveStudent.findOne({
      where: withBranchScope(req, { id }),
    });
    if (!student) return next(BaseError.BadRequest(404, "Topilmadi (yoki ruxsat yo'q)"));

    await student.destroy();

    res.status(200).json({ message: "O'quvchi zaxiradan o'chirildi" });
  } catch (err) {
    next(err);
  }
};

async function getGroups(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = "uz";
    const groups = await Group.findAll({
      where: withBranchScope(req),
      include: [
        {
          model: Teacher,
          as: "teacher",
          attributes: [
            "id",
            "first_name",
            "last_name",
            "phone_number",
            "subject",
          ],
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
      return next(
        BaseError.BadRequest(404, i18next.t("groups_not_found", { lng: lang }))
      );
    }

    res.json(groups)
  } catch (error: any) {
    next(error);
  }
}

async function getOneTeacherGroup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const groupId = req.params.id
    const lang = "uz";
    const group = await Group.findByPk(groupId, {
      include: [
        {
          model: Teacher,
          as: "teacher",
          attributes: [
            "id",
            "first_name",
            "last_name",
            "phone_number",
            "subject",
          ],
        },
        {
          model: Schedule,
          as: "groupSchedules", // Yangi alias
          include: [{ model: Room, as: "room", attributes: ["id", "name"] }],
        },
      ],
    });

    if (!group) return next(BaseError.BadRequest(404, "Guruh topilmadi (yoki ruxsat yo'q)"));

    const studentsInThisGroup = await Student.findAll({
      include: [{
        model: StudentGroup,
        as: "studentGroups",
        where: { group_id: group.dataValues.id },
        attributes: [],
      }],
    });

    res.status(200).json({ group, studentsInThisGroup });
  } catch (error) {
    next(error);
  }
}

async function getOneGroup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = "uz";
    const group = await Group.findOne({
      where: withBranchScope(req, { id: req.params.id }),
      include: [
        {
          model: Teacher,
          as: "teacher",
          attributes: [
            "id",
            "first_name",
            "last_name",
            "phone_number",
            "subject",
          ],
        },
        {
          model: Schedule,
          as: "groupSchedules", // Yangi alias
          include: [{ model: Room, as: "room", attributes: ["id", "name"] }],
        },
      ],
    });

    if (!group) return next(BaseError.BadRequest(404, "Guruh topilmadi (yoki ruxsat yo'q)"));

    // StudentGroup orqali guruhga bog'langan o'quvchilarni olish
    const studentsInThisGroup = await Student.findAll({
      where: withBranchScope(req), // student.branch_id filter
      include: [{
        model: StudentGroup,
        as: "studentGroups",
        where: { group_id: group.dataValues.id },
        attributes: [],
      }],
    });

    res.status(200).json({ group, studentsInThisGroup });
  } catch (error) {
    next(error);
  }
}

async function getOneGroupForTeacherAttendance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const groupId = req.query.group_id as string;
    if (!groupId) return res.status(400).json({ error: "group_id required" });

    const group = await Group.findByPk(groupId, {
      attributes: ["id", "group_subject", "days", "start_time", "end_time"],
      include: [
        {
          model: Teacher,
          as: "teacher",
          attributes: ["first_name", "last_name"],
        },
      ],
    });
    if (!group) {
      return next(BaseError.BadRequest(404, "Guruh topilmadi"));
    }
    res.status(200).json(group);
  } catch (error) {
    next(error);
  }
}

async function createGroup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
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
    if (
      !group_subject ||
      !teacher_id ||
      !room_id ||
      !days ||
      !start_time ||
      !end_time
    ) {
      return next(
        BaseError.BadRequest(
          400,
          i18next.t("missing_parameters", { lng: lang })
        )
      );
    }

    // UUID formatini tekshirish
    if (!uuidValidate(room_id) || !uuidValidate(teacher_id)) {
      return next(
        BaseError.BadRequest(
          400,
          i18next.t("invalid_uuid_format", { lng: lang })
        )
      );
    }

    const scope = (req as any).scope;
    const branch_id = scope?.all ? req.body.branch_id : scope.branchIds?.[0];

    if (!branch_id) return next(BaseError.BadRequest(400, "branch_id required"));

    const room = await Room.findOne({ where: withBranchScope(req, { id: room_id }) });
    if (!room) return next(BaseError.BadRequest(404, "Room topilmadi (yoki ruxsat yo'q)"));

    const teacher = await Teacher.findOne({ where: withBranchScope(req, { id: teacher_id }) });
    if (!teacher) return next(BaseError.BadRequest(404, "Teacher topilmadi (yoki ruxsat yo'q)"));

    const parsedDays = days.split("-").map((item) => item.toUpperCase());

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
        return next(
          BaseError.BadRequest(400, i18next.t("room_conflict", { lng: lang }))
        );
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
      branch_id
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

async function updateGroup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
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

    const group = await Group.findOne({
      where: withBranchScope(req, { id: req.params.id }),
    });
    if (!group) return next(BaseError.BadRequest(404, "Guruh topilmadi (yoki ruxsat yo'q)"));

    if (!group) {
      return next(
        BaseError.BadRequest(404, i18next.t("group_not_found", { lng: lang }))
      );
    }

    if (room_id && days && start_time && end_time) {
      if (!uuidValidate(room_id) || (teacher_id && !uuidValidate(teacher_id))) {
        return next(
          BaseError.BadRequest(
            400,
            i18next.t("invalid_uuid_format", { lng: lang })
          )
        );
      }

      const room = await Room.findByPk(room_id);
      if (!room) {
        return next(
          BaseError.BadRequest(404, i18next.t("room_not_found", { lng: lang }))
        );
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
          return next(
            BaseError.BadRequest(400, i18next.t("room_conflict", { lng: lang }))
          );
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

async function deleteGroup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = "uz";
    const group = await Group.findOne({
      where: withBranchScope(req, { id: req.params.id }),
    });

    if (!group) {
      return next(
        BaseError.BadRequest(404, i18next.t("group_not_found", { lng: lang }))
      );
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

export {
  getGroups,
  getOneGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  getOneTeacherGroup,
  getOneGroupForTeacherAttendance,
  approveReserveStudent,
  createReserveStudent,
};
