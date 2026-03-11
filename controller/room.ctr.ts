import { NextFunction, Request, Response } from "express";
import { BaseError } from "../Utils/base_error";
import i18next from "../Utils/lang";
import { Room, Schedule, Group, Teacher } from "../Models/index";
import { Op } from "sequelize";
import { ICreateRoomDto } from "../DTO/room/create-room.dto";
import { IUpdateRoomDto } from "../DTO/room/update-room.dto";
import { withBranchScope } from "../Utils/branch_scope.helper";

function isSunday(day: string) {
  const d = String(day || "").trim().toLowerCase();
  return d === "sunday" || d === "yakshanba";
}

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

    const WORK_START = 9 * 60;   // 09:00 => 540
    const WORK_END = 18 * 60;    // 18:00 => 1080
    const TOTAL_HOURS_PER_DAY = 9;
    const WORK_DAYS = 6;
    const totalHours = TOTAL_HOURS_PER_DAY * WORK_DAYS; // 54 soat

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

        const busyMinutesByDay = new Map<string, { start: number; end: number }[]>();

        schedules.forEach((schedule) => {
          if (isSunday(schedule.dataValues.day)) return;

          const [startHour, startMinute] = String(schedule.dataValues.start_time)
            .split(":")
            .map(Number);

          const [endHour, endMinute] = String(schedule.dataValues.end_time)
            .split(":")
            .map(Number);

          const startMinutes = startHour * 60 + startMinute;
          const endMinutes = endHour * 60 + endMinute;

          if (endMinutes <= startMinutes) return;

          if (!busyMinutesByDay.has(schedule.dataValues.day)) {
            busyMinutesByDay.set(schedule.dataValues.day, []);
          }

          busyMinutesByDay.get(schedule.dataValues.day)!.push({
            start: startMinutes,
            end: endMinutes,
          });
        });

        let totalBusyMinutes = 0;
        const busyIntervalsByDay = new Map<string, { start: number; end: number }[]>();

        busyMinutesByDay.forEach((intervals, day) => {
          if (!intervals.length) {
            busyIntervalsByDay.set(day, []);
            return;
          }

          intervals.sort((a, b) => a.start - b.start);

          const merged = [intervals[0]];

          for (let i = 1; i < intervals.length; i++) {
            const current = intervals[i];
            const lastMerged = merged[merged.length - 1];

            if (current.start <= lastMerged.end) {
              lastMerged.end = Math.max(current.end, lastMerged.end);
            } else {
              merged.push({ ...current });
            }
          }

          busyIntervalsByDay.set(day, merged);

          merged.forEach((interval) => {
            const clippedStart = Math.max(interval.start, WORK_START);
            const clippedEnd = Math.min(interval.end, WORK_END);

            if (clippedEnd > clippedStart) {
              totalBusyMinutes += clippedEnd - clippedStart;
            }
          });
        });

        const totalBusyHours = totalBusyMinutes / 60;
        const occupancyPercentage = (totalBusyHours / totalHours) * 100;
        const roundedPercentage = Math.min(Math.round(occupancyPercentage), 100);

        let busiestFreePeriod = "Peshindan oldin ham peshindan keyin ham tig'iz";
        let morningBusyMinutes = 0;   // 09:00 - 13:00 => 240 daqiqa
        let afternoonBusyMinutes = 0; // 13:00 - 18:00 => 300 daqiqa

        busyIntervalsByDay.forEach((intervals) => {
          intervals.forEach((interval) => {
            const start = Math.max(interval.start, WORK_START);
            const end = Math.min(interval.end, WORK_END);

            if (end <= start) return;

            // 09:00 - 13:00
            const morningStart = Math.max(start, 540);
            const morningEnd = Math.min(end, 780);
            if (morningEnd > morningStart) {
              morningBusyMinutes += morningEnd - morningStart;
            }

            // 13:00 - 18:00
            const afternoonStart = Math.max(start, 780);
            const afternoonEnd = Math.min(end, 1080);
            if (afternoonEnd > afternoonStart) {
              afternoonBusyMinutes += afternoonEnd - afternoonStart;
            }
          });
        });

        const morningTotalMinutes = 240 * 6;   // 4 soat * 6 kun
        const afternoonTotalMinutes = 300 * 6; // 5 soat * 6 kun

        const morningFreeMinutes = morningTotalMinutes - morningBusyMinutes;
        const afternoonFreeMinutes = afternoonTotalMinutes - afternoonBusyMinutes;

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

    return res.status(200).json(roomsWithOccupancy);
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

    const WORK_START = 9 * 60;   // 09:00 => 540
    const WORK_END = 18 * 60;    // 18:00 => 1080
    const WORK_HOURS_PER_DAY = 9;
    const WORK_DAYS = 6;
    const totalHours = WORK_HOURS_PER_DAY * WORK_DAYS;

    const busyMinutesByDay = new Map<string, { start: number; end: number }[]>();

    schedules.forEach((schedule) => {
      const day = String(schedule.dataValues.day || "").trim().toLowerCase();

      if (isSunday(day)) return;

      const [startHour, startMinute] = String(schedule.dataValues.start_time)
        .split(":")
        .map(Number);

      const [endHour, endMinute] = String(schedule.dataValues.end_time)
        .split(":")
        .map(Number);

      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      if (endMinutes <= startMinutes) return;

      if (!busyMinutesByDay.has(day)) {
        busyMinutesByDay.set(day, []);
      }

      busyMinutesByDay.get(day)!.push({
        start: startMinutes,
        end: endMinutes,
      });
    });

    let totalBusyMinutes = 0;
    const busyIntervalsByDay = new Map<string, { start: number; end: number }[]>();

    busyMinutesByDay.forEach((intervals, day) => {
      if (!intervals.length) {
        busyIntervalsByDay.set(day, []);
        return;
      }

      intervals.sort((a, b) => a.start - b.start);

      const merged = [{ ...intervals[0] }];

      for (let i = 1; i < intervals.length; i++) {
        const current = intervals[i];
        const lastMerged = merged[merged.length - 1];

        if (current.start <= lastMerged.end) {
          lastMerged.end = Math.max(current.end, lastMerged.end);
        } else {
          merged.push({ ...current });
        }
      }

      busyIntervalsByDay.set(day, merged);

      merged.forEach((interval) => {
        const clippedStart = Math.max(interval.start, WORK_START);
        const clippedEnd = Math.min(interval.end, WORK_END);

        if (clippedEnd > clippedStart) {
          totalBusyMinutes += clippedEnd - clippedStart;
        }
      });
    });

    const totalBusyHours = totalBusyMinutes / 60;
    const occupancyPercentage = (totalBusyHours / totalHours) * 100;
    const roundedPercentage = Math.min(Math.round(occupancyPercentage), 100);

    let busiestFreePeriod = "Peshindan oldin ham peshindan keyin ham tig'iz";
    let morningBusyMinutes = 0;   // 09:00 - 13:00
    let afternoonBusyMinutes = 0; // 13:00 - 18:00

    busyIntervalsByDay.forEach((intervals) => {
      intervals.forEach((interval) => {
        const start = Math.max(interval.start, WORK_START);
        const end = Math.min(interval.end, WORK_END);

        if (end <= start) return;

        // 09:00 - 13:00
        const morningStart = Math.max(start, 540);
        const morningEnd = Math.min(end, 780);
        if (morningEnd > morningStart) {
          morningBusyMinutes += morningEnd - morningStart;
        }

        // 13:00 - 18:00
        const afternoonStart = Math.max(start, 780);
        const afternoonEnd = Math.min(end, 1080);
        if (afternoonEnd > afternoonStart) {
          afternoonBusyMinutes += afternoonEnd - afternoonStart;
        }
      });
    });

    const morningTotalMinutes = 240 * 6;   // 4 soat * 6 kun
    const afternoonTotalMinutes = 300 * 6; // 5 soat * 6 kun

    const morningFreeMinutes = morningTotalMinutes - morningBusyMinutes;
    const afternoonFreeMinutes = afternoonTotalMinutes - afternoonBusyMinutes;

    if (morningFreeMinutes > afternoonFreeMinutes && morningFreeMinutes > 0) {
      busiestFreePeriod = "Peshindan oldin";
    } else if (afternoonFreeMinutes > morningFreeMinutes && afternoonFreeMinutes > 0) {
      busiestFreePeriod = "Peshindan keyin";
    } else if (morningFreeMinutes > 0 && afternoonFreeMinutes > 0) {
      busiestFreePeriod = "Ham peshindan oldin, ham peshindan keyin";
    }

    const result = {
      ...room.toJSON(),
      schedules,
      occupancyPercentage: roundedPercentage,
      busiestFreePeriod,
    };

    return res.status(200).json(result);
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
    const roomWhere = branchIds?.length
      ? { branch_id: { [Op.in]: branchIds } }
      : {};

    const rooms = await Room.findAll({
      where: roomWhere,
      attributes: ["id", "branch_id", "name"],
      include: [
        {
          model: Schedule,
          as: "roomSchedules",
          attributes: ["day", "start_time", "end_time"],
          required: false,
        },
      ],
    });

    if (rooms.length === 0) {
      return 0;
    }

    let percent = 0;

    for (const room of rooms as any[]) {
      const plainRoom =
        typeof room.get === "function" ? room.get({ plain: true }) : room;

      const schedules = Array.isArray(plainRoom.roomSchedules)
        ? plainRoom.roomSchedules
        : [];

      percent += calcOccupancy(schedules);
    }

    return Math.round(percent / rooms.length);
  } catch (error: any) {
    throw error;
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
  const WORK_START = 9 * 60;   // 09:00 => 540
  const WORK_END = 18 * 60;    // 18:00 => 1080
  const WORK_DAYS = 6;
  const totalMinutes = (WORK_END - WORK_START) * WORK_DAYS; // 540 * 6 = 3240

  const busyByDay = new Map<string, { start: number; end: number }[]>();

  for (const s of schedules) {
    const day = String(s.day || "").trim().toLowerCase();
    if (isSunday(day)) continue;

    const [sh, sm] = String(s.start_time).split(":").map(Number);
    const [eh, em] = String(s.end_time).split(":").map(Number);

    const start = sh * 60 + sm;
    const end = eh * 60 + em;

    if (end <= start) continue;

    if (!busyByDay.has(day)) {
      busyByDay.set(day, []);
    }

    busyByDay.get(day)!.push({ start, end });
  }

  let busyMinutes = 0;

  for (const intervals of busyByDay.values()) {
    if (!intervals.length) continue;

    intervals.sort((a, b) => a.start - b.start);

    const merged = [{ ...intervals[0] }];

    for (let i = 1; i < intervals.length; i++) {
      const cur = intervals[i];
      const last = merged[merged.length - 1];

      if (cur.start <= last.end) {
        last.end = Math.max(last.end, cur.end);
      } else {
        merged.push({ ...cur });
      }
    }

    for (const m of merged) {
      const clippedStart = Math.max(m.start, WORK_START);
      const clippedEnd = Math.min(m.end, WORK_END);

      if (clippedEnd > clippedStart) {
        busyMinutes += clippedEnd - clippedStart;
      }
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