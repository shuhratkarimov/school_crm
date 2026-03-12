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
import { v4 as uuidv4 } from "uuid";
import { createBulkJob, getBulkJob, updateBulkJob } from "../Utils/sse_jobs";

export const streamBulkJobProgress = async (req: Request, res: Response) => {
  const { jobId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const interval = setInterval(() => {
    const job = getBulkJob(jobId);

    if (!job) {
      send({
        status: "error",
        message: "Job topilmadi",
        done: true,
      });
      clearInterval(interval);
      return res.end();
    }

    send({
      ...job,
      done: job.status === "done" || job.status === "error",
    });

    if (job.status === "done" || job.status === "error") {
      clearInterval(interval);
      return res.end();
    }
  }, 500);

  req.on("close", () => {
    clearInterval(interval);
    res.end();
  });
};

export const startDeleteReserveStudentsBulk = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return next(BaseError.BadRequest(400, "ids massiv bo'lishi kerak va bo'sh bo'lmasligi kerak"));
    }

    const scopedStudents = await ReserveStudent.findAll({
      where: withBranchScope(req, {
        id: { [Op.in]: ids },
      }),
      attributes: ["id"],
    });

    const allowedIds = scopedStudents.map((student: any) => String(student.get("id")));

    if (allowedIds.length !== ids.length) {
      return next(BaseError.BadRequest(403, "Ba'zi o'quvchilar topilmadi yoki ruxsat yo'q"));
    }

    const jobId = uuidv4();
    createBulkJob(jobId, "delete_reserve_students_bulk", allowedIds.length);

    res.status(202).json({
      success: true,
      jobId,
      message: "Bulk delete boshlandi",
    });

    setImmediate(async () => {
      try {
        updateBulkJob(jobId, {
          status: "running",
          message: "O'chirish boshlandi",
        });

        let successCount = 0;
        let failedCount = 0;

        for (let i = 0; i < allowedIds.length; i++) {
          const id = allowedIds[i];

          try {
            const student = await ReserveStudent.findOne({
              where: withBranchScope(req, { id }),
            });

            if (student) {
              await student.destroy();
              successCount++;
            } else {
              failedCount++;
            }
          } catch (err: any) {
            failedCount++;
          }

          const processed = i + 1;
          const percent = Math.round((processed / allowedIds.length) * 100);

          updateBulkJob(jobId, {
            processed,
            percent,
            successCount,
            failedCount,
            message: `${processed}/${allowedIds.length} ta o'quvchi o'chirildi`,
          });
        }

        updateBulkJob(jobId, {
          status: "done",
          percent: 100,
          processed: allowedIds.length,
          successCount,
          failedCount,
          message: `${successCount} ta o'quvchi o'chirildi`,
        });
      } catch (err: any) {
        updateBulkJob(jobId, {
          status: "error",
          message: err?.message || "Bulk delete jarayonida xato",
        });
      }
    });
  } catch (err) {
    next(err);
  }
};

export const startApproveReserveStudentsBulk = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { reserve_student_ids = [], group_ids = [] } = req.body;

  try {
    if (!Array.isArray(reserve_student_ids) || reserve_student_ids.length === 0) {
      return next(BaseError.BadRequest(400, "reserve_student_ids massiv bo'lishi kerak"));
    }

    if (!Array.isArray(group_ids) || group_ids.length === 0) {
      return next(BaseError.BadRequest(400, "group_ids massiv bo'lishi kerak"));
    }

    const reserves = await ReserveStudent.findAll({
      where: withBranchScope(req, {
        id: { [Op.in]: reserve_student_ids },
      }),
    });

    if (reserves.length !== reserve_student_ids.length) {
      return next(BaseError.BadRequest(404, "Ba'zi zaxiradagi o'quvchilar topilmadi yoki ruxsat yo'q"));
    }

    const allowedGroups = await Group.findAll({
      where: withBranchScope(req, {
        id: { [Op.in]: group_ids },
      }),
      attributes: ["id", "group_subject"],
    });

    if (allowedGroups.length !== group_ids.length) {
      return next(BaseError.BadRequest(403, "Group ro'yxatida ruxsatsiz guruh bor"));
    }

    const safeGroupIds = allowedGroups.map((g: any) => String(g.get("id")));
    const groupMap = new Map(allowedGroups.map((g: any) => [String(g.get("id")), g]));

    const jobId = uuidv4();
    createBulkJob(jobId, "approve_reserve_students_bulk", reserves.length);

    res.status(202).json({
      success: true,
      jobId,
      message: "Bulk approve boshlandi",
    });

    setImmediate(async () => {
      try {
        updateBulkJob(jobId, {
          status: "running",
          message: "O'quvchilarni o'tkazish boshlandi",
        });

        let successCount = 0;
        let failedCount = 0;

        const currentYear = new Date().getFullYear();
        const currentMonthIndex = new Date().getMonth() + 1;

        const monthsToCreate: string[] = [];
        for (let m = currentMonthIndex; m <= 12; m++) {
          monthsToCreate.push(monthsInUzbek[m]);
        }

        for (let i = 0; i < reserves.length; i++) {
          const reserve = reserves[i];

          try {
            await sequelize.transaction(async (t) => {
              const ReturnedId = await generateStudentId();

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

              for (const gid of safeGroupIds) {
                for (const month of monthsToCreate) {
                  await StudentGroup.findOrCreate({
                    where: {
                      student_id: newStudent.dataValues.id,
                      group_id: gid,
                      month,
                      year: currentYear,
                    },
                    defaults: { paid: false },
                    transaction: t,
                  });
                }

                const group = groupMap.get(String(gid)) as any;
                if (group) {
                  await group.increment("students_amount", { by: 1, transaction: t });
                }
              }

              await reserve.destroy({ transaction: t });
            });

            successCount++;
          } catch (err: any) {
            failedCount++;
          }

          const processed = i + 1;
          const percent = Math.round((processed / reserves.length) * 100);

          updateBulkJob(jobId, {
            processed,
            percent,
            successCount,
            failedCount,
            message: `${processed}/${reserves.length} ta o'quvchi o'tkazildi`,
          });
        }

        updateBulkJob(jobId, {
          status: "done",
          percent: 100,
          processed: reserves.length,
          successCount,
          failedCount,
          message: `${successCount} ta o'quvchi students jadvaliga o'tkazildi`,
        });
      } catch (err: any) {
        updateBulkJob(jobId, {
          status: "error",
          message: err?.message || "Bulk approve jarayonida xato",
        });
      }
    });
  } catch (err) {
    next(err);
  }
};

export const startImportStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scope = (req as any).scope;
    const branch_id = scope?.all ? req.body.branch_id : scope.branchIds?.[0];
    if (!branch_id) return next(BaseError.BadRequest(400, "branch_id required"));

    if (!req.body || !req.body.students) {
      return next(BaseError.BadRequest(400, "students maydoni majburiy"));
    }

    if (!Array.isArray(req.body.students)) {
      return next(BaseError.BadRequest(400, "students massiv bo'lishi kerak"));
    }

    const students = req.body.students;
    const jobId = uuidv4();

    createBulkJob(jobId, "import_students", students.length);

    res.status(202).json({
      success: true,
      jobId,
      message: "Import boshlandi",
    });

    setImmediate(async () => {
      try {
        updateBulkJob(jobId, {
          status: "running",
          message: "Import boshlandi",
        });

        let successCount = 0;
        let failedCount = 0;
        const errors: string[] = [];

        for (let i = 0; i < students.length; i++) {
          const data = students[i];

          try {
            await ReserveStudent.create({
              first_name: data.first_name,
              last_name: data.last_name,
              father_name: data.father_name,
              mother_name: data.mother_name,
              birth_date: data.birth_date ? new Date(data.birth_date) : null,
              phone_number: data.phone_number,
              parents_phone_number: data.parents_phone_number,
              came_in_school: data.came_in_school ? new Date(data.came_in_school) : null,
              status: "new",
              created_at: new Date(),
              branch_id,
            });

            successCount++;
          } catch (err: any) {
            failedCount++;
            errors.push(`${i + 1}-qator: ${err?.message || "Xato"}`);
          }

          const processed = i + 1;
          const percent = Math.round((processed / students.length) * 100);

          updateBulkJob(jobId, {
            processed,
            percent,
            successCount,
            failedCount,
            errors,
            message: `${processed}/${students.length} ta o'quvchi import qilindi`,
          });
        }

        updateBulkJob(jobId, {
          status: "done",
          percent: 100,
          processed: students.length,
          successCount,
          failedCount,
          errors,
          message: `${successCount} ta o'quvchi import qilindi`,
        });
      } catch (err: any) {
        updateBulkJob(jobId, {
          status: "error",
          message: err?.message || "Import jarayonida xato",
        });
      }
    });
  } catch (err) {
    next(err);
  }
};

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
    const scope = (req as any).scope;
    const branch_id = scope?.all ? req.body.branch_id : scope.branchIds?.[0];
    if (!branch_id) return next(BaseError.BadRequest(400, "branch_id required"));

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
            status: "new",
            created_at: new Date(),
            branch_id: branch_id,
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
    return;
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

    if (!student) {
      return next(BaseError.BadRequest(404, "Topilmadi (yoki ruxsat yo'q)"));
    }

    await student.update({
      ...data,
      birth_date: data.birth_date ? new Date(data.birth_date) : student.dataValues.birth_date,
      came_in_school: data.came_in_school ? new Date(data.came_in_school) : student.dataValues.came_in_school,
    });

    return res.status(200).json({
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

export const deleteReserveStudentsBulk = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return next(BaseError.BadRequest(400, "ids massiv bo'lishi kerak va bo'sh bo'lmasligi kerak"));
    }

    const scopedStudents = await ReserveStudent.findAll({
      where: withBranchScope(req, {
        id: {
          [Op.in]: ids,
        },
      }),
      attributes: ["id"],
    });

    const allowedIds = scopedStudents.map((student: any) => String(student.get("id")));

    if (allowedIds.length !== ids.length) {
      return next(BaseError.BadRequest(403, "Ba'zi o'quvchilar topilmadi yoki ruxsat yo'q"));
    }

    const deletedCount = await ReserveStudent.destroy({
      where: withBranchScope(req, {
        id: {
          [Op.in]: ids,
        },
      }),
    });

    return res.status(200).json({
      success: true,
      message: `${deletedCount} ta o'quvchi zaxiradan o'chirildi`,
      deletedCount,
    });
  } catch (err) {
    next(err);
  }
};

export const approveReserveStudentsBulk = async (req: Request, res: Response, next: NextFunction) => {
  const { reserve_student_ids = [], group_ids = [] } = req.body;

  try {
    if (!Array.isArray(reserve_student_ids) || reserve_student_ids.length === 0) {
      return next(BaseError.BadRequest(400, "reserve_student_ids massiv bo'lishi kerak"));
    }

    if (!Array.isArray(group_ids) || group_ids.length === 0) {
      return next(BaseError.BadRequest(400, "group_ids massiv bo'lishi kerak"));
    }

    const reserves = await ReserveStudent.findAll({
      where: withBranchScope(req, {
        id: {
          [Op.in]: reserve_student_ids,
        },
      }),
    });

    if (reserves.length !== reserve_student_ids.length) {
      return next(
        BaseError.BadRequest(404, "Ba'zi zaxiradagi o'quvchilar topilmadi yoki ruxsat yo'q")
      );
    }

    const allowedGroups = await Group.findAll({
      where: withBranchScope(req, {
        id: {
          [Op.in]: group_ids,
        },
      }),
      attributes: ["id", "group_subject"],
    });

    if (allowedGroups.length !== group_ids.length) {
      return next(BaseError.BadRequest(403, "Group ro'yxatida ruxsatsiz guruh bor"));
    }

    const safeGroupIds = allowedGroups.map((g: any) => String(g.get("id")));

    let createdStudentsCount = 0;

    await sequelize.transaction(async (t) => {
      const currentYear = new Date().getFullYear();
      const currentMonthIndex = new Date().getMonth() + 1;

      const monthsToCreate: string[] = [];
      for (let m = currentMonthIndex; m <= 12; m++) {
        monthsToCreate.push(monthsInUzbek[m]);
      }

      for (const reserve of reserves) {
        const ReturnedId = await generateStudentId();

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

        await reserve.destroy({ transaction: t });

        await updateStudentPaymentStatus(newStudent.dataValues.id);

        createdStudentsCount++;
      }
    });

    return res.status(200).json({
      success: true,
      message: `${createdStudentsCount} ta o'quvchi students jadvaliga o'tkazildi va guruhlarga biriktirildi`,
      count: createdStudentsCount,
    });
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
        {
          model: Room,
          as: "room",
          attributes: ["id", "name", "capacity"],
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

function timeToMinutes(time: string): number {
  const [hour, minute] = String(time).split(":").map(Number);
  return hour * 60 + minute;
}

function isValidTimeFormat(time: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(time));
}

function validateGroupTimeRange(start_time: string, end_time: string): string | null {
  if (!isValidTimeFormat(start_time.slice(0, 5)) || !isValidTimeFormat(end_time.slice(0, 5))) {
    return "Vaqt formati noto'g'ri. HH:mm ko'rinishida yuboring";
  }

  const WORK_START = 9 * 60;   // 09:00
  const WORK_END = 18 * 60;    // 18:00

  const startMinutes = timeToMinutes(start_time);
  const endMinutes = timeToMinutes(end_time);

  if (startMinutes < WORK_START || endMinutes > WORK_END) {
    return "Dars vaqti 09:00 dan 18:00 gacha bo'lishi kerak";
  }

  if (endMinutes <= startMinutes) {
    return "Dars tugash vaqti boshlanish vaqtidan katta bo'lishi kerak";
  }

  return null;
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

    const timeValidationError = validateGroupTimeRange(start_time, end_time);
    if (timeValidationError) {
      return next(BaseError.BadRequest(400, timeValidationError));
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

      const timeValidationError = validateGroupTimeRange(start_time, end_time);
      if (timeValidationError) {
        return next(BaseError.BadRequest(400, timeValidationError));
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
