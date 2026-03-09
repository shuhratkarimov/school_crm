import { NextFunction, Request, Response } from "express";
import { BaseError } from "../Utils/base_error";
import i18next from "../Utils/lang";
import { Room, Schedule, Group, Teacher } from "../Models/index";
import { Op } from "sequelize";
import { ICreateRoomDto } from "../DTO/room/create-room.dto";
import { IUpdateRoomDto } from "../DTO/room/update-room.dto";
import { withBranchScope } from "../Utils/branch_scope.helper";

async function getRooms(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"] || "uz";
    const rooms = await Room.findAll({
      where: withBranchScope(req),
    });

    if (rooms.length === 0) {
      return next(
        BaseError.BadRequest(404, i18next.t("rooms_not_found", { lng: lang }))
      );
    }

    // Har bir xona uchun bandlik foizini hisoblash
    const roomsWithOccupancy = await Promise.all(
      rooms.map(async (room) => {
        const schedules = await Schedule.findAll({
          where: { room_id: room.dataValues.id },
          include: [
            { model: Group, as: "scheduleGroup", attributes: ["id", "group_subject"] },
            {
              model: Teacher,
              as: "teacher",
              attributes: ["id", "first_name", "last_name"],
            },
          ],
        });

        // Umumiy ish vaqti (05:00 - 21:00 = 16 soat * 6 kun, yakshanba hisobga olinmaydi)
        const totalHours = 16 * 6; // 96 soat

        // Band bo'lgan vaqtni kunlarga ajratib, overlapping larni hisobga olmagan holda hisoblash
        const busyMinutesByDay = new Map();
        schedules.forEach((schedule) => {
          const day = schedule.dataValues.day;
          // Yakshanbani (Sunday) hisobga olmagan holda filter qilish
          if (day.toLowerCase() !== "sunday") {
            const [startHour, startMinute] = schedule.dataValues.start_time.split(":").map(Number);
            const [endHour, endMinute] = schedule.dataValues.end_time.split(":").map(Number);
            const startMinutes = startHour * 60 + startMinute;
            const endMinutes = endHour * 60 + endMinute;

            if (!busyMinutesByDay.has(day)) {
              busyMinutesByDay.set(day, []);
            }
            busyMinutesByDay.get(day).push({ start: startMinutes, end: endMinutes });
          }
        });

        let totalBusyMinutes = 0;
        const busyIntervalsByDay = new Map();
        busyMinutesByDay.forEach((intervals, day) => {
          // Vaqt oralig‘larini tartibga solish va overlapping larni chiqarib tashlash
          intervals.sort((a: any, b: any) => a.start - b.start);
          let merged = [intervals[0]];
          for (let i = 1; i < intervals.length; i++) {
            const current = intervals[i];
            const lastMerged = merged[merged.length - 1];
            if (current.start <= lastMerged.end) {
              lastMerged.end = Math.max(current.end, lastMerged.end);
            } else {
              merged.push(current);
            }
          }
          busyIntervalsByDay.set(day, merged);

          // Har bir merged interval uchun band vaqtni hisoblash (maksimum 16 soat = 960 daqiqa)
          merged.forEach((interval) => {
            const busyDuration = Math.min(interval.end - interval.start, 960); // 16 soat = 960 daqiqa
            totalBusyMinutes += busyDuration;
          });
        });

        // Umumiy band vaqtni soatga aylantirish va foizni hisoblash
        const totalBusyHours = totalBusyMinutes / 60;
        const occupancyPercentage = (totalBusyHours / totalHours) * 100;
        const roundedPercentage = Math.min(Math.round(occupancyPercentage), 100);

        // Qaysi vaqt oralig‘ida asosan bo‘sh ekanligini aniqlash
        let busiestFreePeriod = "Peshindan oldin ham peshindan keyin ham tig'iz";
        let morningBusyMinutes = 0; // 05:00 - 13:00 (480 daqiqa)
        let afternoonBusyMinutes = 0; // 13:00 - 21:00 (480 daqiqa)

        busyIntervalsByDay.forEach((intervals) => {
          intervals.forEach((interval: any) => {
            const start = interval.start;
            const end = interval.end;

            // Peshindan oldin (05:00 - 13:00) band vaqt
            if (start < 780 && end > 300) { // 13:00 = 780 daqiqa, 05:00 = 300 daqiqa
              const morningStart = Math.max(start, 300); // 05:00 dan boshlanadi
              const morningEnd = Math.min(end, 780); // 13:00 dan oshmaydi
              if (morningEnd > morningStart) {
                morningBusyMinutes += morningEnd - morningStart;
              }
            }

            // Peshindan keyin (13:00 - 21:00) band vaqt
            if (start < 1260 && end > 780) { // 21:00 = 1260 daqiqa
              const afternoonStart = Math.max(start, 780); // 13:00 dan boshlanadi
              const afternoonEnd = Math.min(end, 1260); // 21:00 dan oshmaydi
              if (afternoonEnd > afternoonStart) {
                afternoonBusyMinutes += afternoonEnd - afternoonStart;
              }
            }
          });
        });

        // Umumiy bo‘sh vaqtni hisoblash (har kuni 960 daqiqa, 6 kun = 5760 daqiqa)
        const totalMinutesPerDay = 960;
        const totalMinutes = 5760; // 6 kun
        const morningTotalMinutes = 480 * 6; // 05:00 - 13:00, 6 kun
        const afternoonTotalMinutes = 480 * 6; // 13:00 - 21:00, 6 kun

        const morningFreeMinutes = morningTotalMinutes - morningBusyMinutes;
        const afternoonFreeMinutes = afternoonTotalMinutes - afternoonBusyMinutes;

        // Qaysi vaqt oralig‘ida ko‘proq bo‘sh vaqt borligini aniqlash
        if (morningFreeMinutes > afternoonFreeMinutes && morningFreeMinutes > 0) {
          busiestFreePeriod = "Peshindan oldin";
        } else if (afternoonFreeMinutes > morningFreeMinutes && afternoonFreeMinutes > 0) {
          busiestFreePeriod = "Peshindan keyin";
        } else if (morningFreeMinutes > 0 && afternoonFreeMinutes > 0) {
          busiestFreePeriod = "Ham peshindan oldin, ham peshindan keyin";
        }

        return {
          ...room.toJSON(),
          schedules,
          occupancyPercentage: roundedPercentage,
          busiestFreePeriod,
        };
      })
    );

    res.status(200).json(roomsWithOccupancy);
  } catch (error: any) {
    next(error);
  }
}

async function getOneRoom(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"] || "uz";
    const roomId = req.params.id;
    const room = await Room.findOne({
      where: withBranchScope(req, { id: roomId }),
    });

    if (!room) {
      return next(
        BaseError.BadRequest(404, i18next.t("room_not_found", { lng: lang }))
      );
    }

    // Schedule'larni room_id asosida olish
    const schedules = await Schedule.findAll({
      where: { room_id: roomId },
      include: [
        { model: Group, as: "scheduleGroup", attributes: ["id", "group_subject"] },
        {
          model: Teacher,
          as: "teacher",
          attributes: ["id", "first_name", "last_name"],
        },
      ],
    });

    const totalHours = 16 * 6;

    const busyMinutesByDay = new Map();
    schedules.forEach((schedule) => {
      const day = schedule.dataValues.day;
      if (day.toLowerCase() !== "sunday") {
        const [startHour, startMinute] = schedule.dataValues.start_time.split(":").map(Number);
        const [endHour, endMinute] = schedule.dataValues.end_time.split(":").map(Number);
        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;

        if (!busyMinutesByDay.has(day)) {
          busyMinutesByDay.set(day, []);
        }
        busyMinutesByDay.get(day).push({ start: startMinutes, end: endMinutes });
      }
    });

    let totalBusyMinutes = 0;
    const busyIntervalsByDay = new Map();
    busyMinutesByDay.forEach((intervals, day) => {
      // Vaqt oralig‘larini tartibga solish va overlapping larni chiqarib tashlash
      intervals.sort((a: any, b: any) => a.start - b.start);
      let merged = [intervals[0]];
      for (let i = 1; i < intervals.length; i++) {
        const current = intervals[i];
        const lastMerged = merged[merged.length - 1];
        if (current.start <= lastMerged.end) {
          lastMerged.end = Math.max(current.end, lastMerged.end);
        } else {
          merged.push(current);
        }
      }
      busyIntervalsByDay.set(day, merged);

      // Har bir merged interval uchun band vaqtni hisoblash (maksimum 16 soat = 960 daqiqa)
      merged.forEach((interval) => {
        const busyDuration = Math.min(interval.end - interval.start, 960);
        totalBusyMinutes += busyDuration;
      });
    });

    const totalBusyHours = totalBusyMinutes / 60;
    const occupancyPercentage = (totalBusyHours / totalHours) * 100;
    const roundedPercentage = Math.min(Math.round(occupancyPercentage), 100);

    // Qaysi vaqt oralig‘ida asosan bo‘sh ekanligini aniqlash
    let busiestFreePeriod = "Peshindan oldin ham peshindan keyin ham tig'iz"; // Default: hech qachon bo‘sh emas
    let morningBusyMinutes = 0; // 05:00 - 13:00 (480 daqiqa)
    let afternoonBusyMinutes = 0; // 13:00 - 21:00 (480 daqiqa)

    busyIntervalsByDay.forEach((intervals) => {
      intervals.forEach((interval: any) => {
        const start = interval.start;
        const end = interval.end;

        // Peshindan oldin (05:00 - 13:00) band vaqt
        if (start < 780 && end > 300) { // 13:00 = 780 daqiqa, 05:00 = 300 daqiqa
          const morningStart = Math.max(start, 300); // 05:00 dan boshlanadi
          const morningEnd = Math.min(end, 780); // 13:00 dan oshmaydi
          if (morningEnd > morningStart) {
            morningBusyMinutes += morningEnd - morningStart;
          }
        }

        // Peshindan keyin (13:00 - 21:00) band vaqt
        if (start < 1260 && end > 780) { // 21:00 = 1260 daqiqa
          const afternoonStart = Math.max(start, 780); // 13:00 dan boshlanadi
          const afternoonEnd = Math.min(end, 1260); // 21:00 dan oshmaydi
          if (afternoonEnd > afternoonStart) {
            afternoonBusyMinutes += afternoonEnd - afternoonStart;
          }
        }
      });
    });

    // Umumiy bo‘sh vaqtni hisoblash (har kuni 960 daqiqa, 6 kun = 5760 daqiqa)
    const totalMinutesPerDay = 960;
    const totalMinutes = 5760; // 6 kun
    const morningTotalMinutes = 480 * 6; // 05:00 - 13:00, 6 kun
    const afternoonTotalMinutes = 480 * 6; // 13:00 - 21:00, 6 kun

    const morningFreeMinutes = morningTotalMinutes - morningBusyMinutes;
    const afternoonFreeMinutes = afternoonTotalMinutes - afternoonBusyMinutes;

    // Qaysi vaqt oralig‘ida ko‘proq bo‘sh vaqt borligini aniqlash
    if (morningFreeMinutes > afternoonFreeMinutes && morningFreeMinutes > 0) {
      busiestFreePeriod = "Peshindan oldin";
    } else if (afternoonFreeMinutes > morningFreeMinutes && afternoonFreeMinutes > 0) {
      busiestFreePeriod = "Peshindan keyin";
    } else if (morningFreeMinutes > 0 && afternoonFreeMinutes > 0) {
      busiestFreePeriod = "Ham peshindan oldin, ham peshindan keyin";
    }

    // Natijaga bandlik foizi va eng ko‘p bo‘sh vaqt oralig‘ini qo'shamiz
    const result = {
      ...room.toJSON(),
      schedules,
      occupancyPercentage: roundedPercentage,
      busiestFreePeriod,
    };

    res.status(200).json(result);
  } catch (error: any) {
    next(error);
  }
}


async function createRoom(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"] || "uz";
    const { name, capacity, branch_id } = req.body as any;

    let finalBranchId = branch_id;

    // manager bo'lsa avtomatik
    if (req.user?.role === "manager") {
      finalBranchId = req.user.branch_id;
    }

    // director bo'lsa scope ichidan bo'lishi shart
    if (req.user?.role === "director") {
      if (!finalBranchId) return next(BaseError.BadRequest(400, "branch_id required"));
      if (!req.scope?.branchIds?.includes(finalBranchId)) {
        return next(BaseError.BadRequest(403, "Sizga ruxsat yo'q (branch scope)"));
      }
    }

    // superadmin bo'lsa branch_id talab qil (yoki default qoida o'zingda)
    if (req.user?.role === "superadmin" && !finalBranchId) {
      return next(BaseError.BadRequest(400, "branch_id required"));
    }

    const room = await Room.create({ name, capacity, branch_id: finalBranchId });

    res.status(201).json({
      message: i18next.t("room_created", { lng: lang }),
      room,
    });
  } catch (error: any) {
    next(error);
  }
}

async function updateRoom(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"] || "uz";
    const { name, capacity, branch_id } = req.body as any;

    const room = await Room.findOne({
      where: withBranchScope(req, { id: req.params.id }),
    });
    if (!room) return next(BaseError.BadRequest(404, "Room topilmadi yoki ruxsat yo'q"));

    if (!room) {
      return next(
        BaseError.BadRequest(404, i18next.t("room_not_found", { lng: lang }))
      );
    }

    await room.update({
      name,
      capacity,
    });

    res.status(200).json({
      message: i18next.t("room_updated", { lng: lang }),
      room,
    });
  } catch (error: any) {
    next(error);
  }
}

async function deleteRoom(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"] || "uz";
    const room = await Room.findByPk(req.params.id);

    if (!room) {
      return next(
        BaseError.BadRequest(404, i18next.t("room_not_found", { lng: lang }))
      );
    }

    await room.destroy();

    res.status(200).json({
      message: i18next.t("room_deleted", { lng: lang }),
    });
  } catch (error: any) {
    next(error);
  }
}

async function getAvailableRooms(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"] || "uz";
    const { day, start_time, end_time } = req.query;

    if (!day || !start_time || !end_time) {
      return next(
        BaseError.BadRequest(
          400,
          i18next.t("missing_parameters", { lng: lang })
        )
      );
    }

    const parsedDays = [day]; // day ni array sifatida ishlatsak, ko'p kunlarni ham qo'llab-quvvatlaydi

    const conflictingSchedules = await Schedule.findAll({
      where: {
        day: { [Op.in]: parsedDays },
        [Op.and]: [
          { start_time: { [Op.lt]: end_time } },
          { end_time: { [Op.gt]: start_time } },
        ],
      },
    });

    const busyRoomIds = conflictingSchedules.map(
      (schedule) => schedule.dataValues.room_id
    );
    const availableRooms = await Room.findAll({
      where: withBranchScope(req, {
        id: { [Op.notIn]: busyRoomIds },
      }),
    });

    res.status(200).json(availableRooms);
  } catch (error: any) {
    next(error);
  }
}

export async function getRoomsBusinessPercent(branchIds?: string[]) {
  try {
    const roomWhere = branchIds?.length ? { branch_id: { [Op.in]: branchIds } } : {};
    const rooms = await Room.findAll({ where: roomWhere });

    if (rooms.length === 0) {
      return
    }

    // Har bir xona uchun bandlik foizini hisoblash
    const roomsWithOccupancy = await Promise.all(
      rooms.map(async (room) => {
        const schedules = await Schedule.findAll({
          where: { room_id: room.dataValues.id },
          include: [
            { model: Group, as: "scheduleGroup", attributes: ["id", "group_subject"] },
            {
              model: Teacher,
              as: "teacher",
              attributes: ["id", "first_name", "last_name"],
            },
          ],
        });

        // Umumiy ish vaqti (05:00 - 21:00 = 16 soat * 6 kun, yakshanba hisobga olinmaydi)
        const totalHours = 16 * 6; // 96 soat

        // Band bo'lgan vaqtni kunlarga ajratib, overlapping larni hisobga olmagan holda hisoblash
        const busyMinutesByDay = new Map();
        schedules.forEach((schedule) => {
          const day = schedule.dataValues.day;
          // Yakshanbani (Sunday) hisobga olmagan holda filter qilish
          if (day.toLowerCase() !== "sunday") {
            const [startHour, startMinute] = schedule.dataValues.start_time.split(":").map(Number);
            const [endHour, endMinute] = schedule.dataValues.end_time.split(":").map(Number);
            const startMinutes = startHour * 60 + startMinute;
            const endMinutes = endHour * 60 + endMinute;

            if (!busyMinutesByDay.has(day)) {
              busyMinutesByDay.set(day, []);
            }
            busyMinutesByDay.get(day).push({ start: startMinutes, end: endMinutes });
          }
        });

        let totalBusyMinutes = 0;
        const busyIntervalsByDay = new Map();
        busyMinutesByDay.forEach((intervals, day) => {
          // Vaqt oralig‘larini tartibga solish va overlapping larni chiqarib tashlash
          intervals.sort((a: any, b: any) => a.start - b.start);
          let merged = [intervals[0]];
          for (let i = 1; i < intervals.length; i++) {
            const current = intervals[i];
            const lastMerged = merged[merged.length - 1];
            if (current.start <= lastMerged.end) {
              lastMerged.end = Math.max(current.end, lastMerged.end);
            } else {
              merged.push(current);
            }
          }
          busyIntervalsByDay.set(day, merged);

          // Har bir merged interval uchun band vaqtni hisoblash (maksimum 16 soat = 960 daqiqa)
          merged.forEach((interval) => {
            const busyDuration = Math.min(interval.end - interval.start, 960); // 16 soat = 960 daqiqa
            totalBusyMinutes += busyDuration;
          });
        });

        // Umumiy band vaqtni soatga aylantirish va foizni hisoblash
        const totalBusyHours = totalBusyMinutes / 60;
        const occupancyPercentage = (totalBusyHours / totalHours) * 100;
        const roundedPercentage = Math.min(Math.round(occupancyPercentage), 100);

        // Qaysi vaqt oralig‘ida asosan bo‘sh ekanligini aniqlash
        let busiestFreePeriod = "Peshindan oldin ham peshindan keyin ham tig'iz";
        let morningBusyMinutes = 0; // 05:00 - 13:00 (480 daqiqa)
        let afternoonBusyMinutes = 0; // 13:00 - 21:00 (480 daqiqa)

        busyIntervalsByDay.forEach((intervals) => {
          intervals.forEach((interval: any) => {
            const start = interval.start;
            const end = interval.end;

            // Peshindan oldin (05:00 - 13:00) band vaqt
            if (start < 780 && end > 300) { // 13:00 = 780 daqiqa, 05:00 = 300 daqiqa
              const morningStart = Math.max(start, 300); // 05:00 dan boshlanadi
              const morningEnd = Math.min(end, 780); // 13:00 dan oshmaydi
              if (morningEnd > morningStart) {
                morningBusyMinutes += morningEnd - morningStart;
              }
            }

            // Peshindan keyin (13:00 - 21:00) band vaqt
            if (start < 1260 && end > 780) { // 21:00 = 1260 daqiqa
              const afternoonStart = Math.max(start, 780); // 13:00 dan boshlanadi
              const afternoonEnd = Math.min(end, 1260); // 21:00 dan oshmaydi
              if (afternoonEnd > afternoonStart) {
                afternoonBusyMinutes += afternoonEnd - afternoonStart;
              }
            }
          });
        });

        // Umumiy bo‘sh vaqtni hisoblash (har kuni 960 daqiqa, 6 kun = 5760 daqiqa)
        const totalMinutesPerDay = 960;
        const totalMinutes = 5760; // 6 kun
        const morningTotalMinutes = 480 * 6; // 05:00 - 13:00, 6 kun
        const afternoonTotalMinutes = 480 * 6; // 13:00 - 21:00, 6 kun

        const morningFreeMinutes = morningTotalMinutes - morningBusyMinutes;
        const afternoonFreeMinutes = afternoonTotalMinutes - afternoonBusyMinutes;

        // Qaysi vaqt oralig‘ida ko‘proq bo‘sh vaqt borligini aniqlash
        if (morningFreeMinutes > afternoonFreeMinutes && morningFreeMinutes > 0) {
          busiestFreePeriod = "Peshindan oldin";
        } else if (afternoonFreeMinutes > morningFreeMinutes && afternoonFreeMinutes > 0) {
          busiestFreePeriod = "Peshindan keyin";
        } else if (morningFreeMinutes > 0 && afternoonFreeMinutes > 0) {
          busiestFreePeriod = "Ham peshindan oldin, ham peshindan keyin";
        }

        return {
          ...room.toJSON(),
          schedules,
          occupancyPercentage: roundedPercentage,
          busiestFreePeriod,
        };
      })
    );
    let percent = 0
    for (const item of roomsWithOccupancy) {
      percent += item.occupancyPercentage
    }
    percent = roomsWithOccupancy ? percent / roomsWithOccupancy.length : 0
    return percent
  } catch (error: any) {
    throw new Error(error)
  }
}

async function getRoomsBusinessPercentByBranch(branchIds: string[]) {
  const schedules = await Schedule.findAll({
    attributes: ["room_id", "day", "start_time", "end_time"],
    include: [
      {
        model: Room,
        as: "room",
        attributes: ["branch_id"],
        required: true,
        where: { branch_id: { [Op.in]: branchIds } },
      },
    ],
    raw: true,
  });

  const roomMap = new Map<string, any[]>();

  for (const s of schedules as any[]) {
    const roomId = s.room_id;

    if (!roomMap.has(roomId)) {
      roomMap.set(roomId, []);
    }

    roomMap.get(roomId)!.push(s);
  }

  const branchAgg = new Map<string, { sum: number; count: number }>();

  for (const [roomId, schedules] of roomMap) {
    const branchId = schedules[0]["room.branch_id"];

    const occ = calcOccupancy(schedules);

    const cur = branchAgg.get(branchId) ?? { sum: 0, count: 0 };
    cur.sum += occ;
    cur.count += 1;

    branchAgg.set(branchId, cur);
  }

  const result = new Map<string, number>();

  for (const [branchId, data] of branchAgg) {
    result.set(branchId, Math.round(data.sum / data.count));
  }

  return result;
}

function calcOccupancy(schedules: any[]) {
  const totalMinutes = 16 * 60 * 6; // 5760

  const busyByDay = new Map<string, any[]>();

  for (const s of schedules) {
    const day = s.day.toLowerCase();

    if (day === "yakshanba") continue;

    const [sh, sm] = s.start_time.split(":");
    const [eh, em] = s.end_time.split(":");

    const start = Number(sh) * 60 + Number(sm);
    const end = Number(eh) * 60 + Number(em);

    if (!busyByDay.has(day)) busyByDay.set(day, []);

    busyByDay.get(day)!.push({ start, end });
  }

  let busyMinutes = 0;

  for (const intervals of busyByDay.values()) {
    intervals.sort((a, b) => a.start - b.start);

    const merged = [intervals[0]];

    for (let i = 1; i < intervals.length; i++) {
      const cur = intervals[i];
      const last = merged[merged.length - 1];

      if (cur.start <= last.end) {
        last.end = Math.max(last.end, cur.end);
      } else {
        merged.push(cur);
      }
    }

    for (const m of merged) {
      busyMinutes += Math.min(m.end - m.start, 960);
    }
  }

  const pct = (busyMinutes / totalMinutes) * 100;

  return Math.min(Math.round(pct), 100);
}

async function getRoomStatsByBranch(branchIds: string[]) {
  const rooms = await Room.findAll({
    where: {
      branch_id: { [Op.in]: branchIds },
    },
    attributes: ["id", "branch_id", "name"],
    include: [
      {
        model: Schedule,
        as: "roomSchedules",
        attributes: ["id"],
        required: false,
      },
    ],
  });

  const result = new Map<
    string,
    { totalRooms: number; busyRooms: number; emptyRooms: number }
  >();

  for (const room of rooms as any[]) {
    const plainRoom =
      typeof room.get === "function" ? room.get({ plain: true }) : room;

    const branchId = String(plainRoom.branch_id);
    const schedules = Array.isArray(plainRoom.roomSchedules)
      ? plainRoom.roomSchedules
      : [];

    const current = result.get(branchId) ?? {
      totalRooms: 0,
      busyRooms: 0,
      emptyRooms: 0,
    };

    current.totalRooms += 1;

    if (schedules.length > 0) {
      current.busyRooms += 1;
    } else {
      current.emptyRooms += 1;
    }

    result.set(branchId, current);
  }

  for (const branchId of branchIds) {
    if (!result.has(String(branchId))) {
      result.set(String(branchId), {
        totalRooms: 0,
        busyRooms: 0,
        emptyRooms: 0,
      });
    }
  }

  return result;
}

export {
  getRooms,
  getOneRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  getAvailableRooms,
  getRoomsBusinessPercentByBranch,
  getRoomStatsByBranch,
};