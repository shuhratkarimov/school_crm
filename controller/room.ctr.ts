import { NextFunction, Request, Response } from "express";
import { BaseError } from "../Utils/base_error";
import i18next from "../Utils/lang";
import { Room, Schedule, Group, Teacher } from "../Models/index";
import { Op } from "sequelize";
import { ICreateRoomDto } from "../DTO/room/create-room.dto";
import { IUpdateRoomDto } from "../DTO/room/update-room.dto";

async function getRooms(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"] || "uz";
    const rooms = await Room.findAll();

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
            { model: Group, as: "group", attributes: ["id", "group_subject"] },
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
          intervals.forEach((interval:any) => {
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
    const room = await Room.findByPk(roomId);

    if (!room) {
      return next(
        BaseError.BadRequest(404, i18next.t("room_not_found", { lng: lang }))
      );
    }

    // Schedule'larni room_id asosida olish
    const schedules = await Schedule.findAll({
      where: { room_id: roomId },
      include: [
        { model: Group, as: "group", attributes: ["id", "group_subject"] },
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
      intervals.forEach((interval:any) => {
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
    const { name, capacity } = req.body as ICreateRoomDto;

    const room = await Room.create({
      name,
      capacity,
    });

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
    const { name, capacity } = req.body as IUpdateRoomDto;

    const room = await Room.findByPk(req.params.id);

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
      where: {
        id: { [Op.notIn]: busyRoomIds },
      },
    });

    console.log("Query params:", req.query);
    console.log("Parsed days:", parsedDays);
    console.log("Conflicting schedules:", conflictingSchedules.length);
    console.log("Available rooms:", availableRooms.length);

    res.status(200).json(availableRooms);
  } catch (error: any) {
    next(error);
  }
}

export async function getRoomsBusinessPercent() {
  try {
    const rooms = await Room.findAll();

    if (rooms.length === 0) {
      return
    }

    // Har bir xona uchun bandlik foizini hisoblash
    const roomsWithOccupancy = await Promise.all(
      rooms.map(async (room) => {
        const schedules = await Schedule.findAll({
          where: { room_id: room.dataValues.id },
          include: [
            { model: Group, as: "group", attributes: ["id", "group_subject"] },
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
          intervals.forEach((interval:any) => {
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
    percent = roomsWithOccupancy ? percent/roomsWithOccupancy.length:0
    return percent
  } catch (error: any) {
    throw new Error(error)
  }
}

export {
  getRooms,
  getOneRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  getAvailableRooms,
};