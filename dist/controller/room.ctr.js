"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoomsBusinessPercent = getRoomsBusinessPercent;
exports.getRooms = getRooms;
exports.getOneRoom = getOneRoom;
exports.createRoom = createRoom;
exports.updateRoom = updateRoom;
exports.deleteRoom = deleteRoom;
exports.getAvailableRooms = getAvailableRooms;
exports.getRoomsBusinessPercentByBranch = getRoomsBusinessPercentByBranch;
exports.getRoomStatsByBranch = getRoomStatsByBranch;
const base_error_1 = require("../Utils/base_error");
const lang_1 = __importDefault(require("../Utils/lang"));
const index_1 = require("../Models/index");
const sequelize_1 = require("sequelize");
const branch_scope_helper_1 = require("../Utils/branch_scope.helper");
function isSunday(day) {
    const d = String(day || "").trim().toLowerCase();
    return d === "sunday" || d === "yakshanba";
}
async function getRooms(req, res, next) {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const rooms = await index_1.Room.findAll({
            where: (0, branch_scope_helper_1.withBranchScope)(req),
        });
        if (rooms.length === 0) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("rooms_not_found", { lng: lang })));
        }
        const WORK_START = 9 * 60; // 09:00 => 540
        const WORK_END = 18 * 60; // 18:00 => 1080
        const TOTAL_HOURS_PER_DAY = 9;
        const WORK_DAYS = 6;
        const totalHours = TOTAL_HOURS_PER_DAY * WORK_DAYS; // 54 soat
        const roomsWithOccupancy = await Promise.all(rooms.map(async (room) => {
            const schedules = await index_1.Schedule.findAll({
                where: { room_id: room.dataValues.id },
                include: [
                    { model: index_1.Group, as: "scheduleGroup", attributes: ["id", "group_subject"] },
                    {
                        model: index_1.Teacher,
                        as: "teacher",
                        attributes: ["id", "first_name", "last_name"],
                    },
                ],
            });
            const busyMinutesByDay = new Map();
            schedules.forEach((schedule) => {
                if (isSunday(schedule.dataValues.day))
                    return;
                const [startHour, startMinute] = String(schedule.dataValues.start_time)
                    .split(":")
                    .map(Number);
                const [endHour, endMinute] = String(schedule.dataValues.end_time)
                    .split(":")
                    .map(Number);
                const startMinutes = startHour * 60 + startMinute;
                const endMinutes = endHour * 60 + endMinute;
                if (endMinutes <= startMinutes)
                    return;
                if (!busyMinutesByDay.has(schedule.dataValues.day)) {
                    busyMinutesByDay.set(schedule.dataValues.day, []);
                }
                busyMinutesByDay.get(schedule.dataValues.day).push({
                    start: startMinutes,
                    end: endMinutes,
                });
            });
            let totalBusyMinutes = 0;
            const busyIntervalsByDay = new Map();
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
                    }
                    else {
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
            let morningBusyMinutes = 0; // 09:00 - 13:00 => 240 daqiqa
            let afternoonBusyMinutes = 0; // 13:00 - 18:00 => 300 daqiqa
            busyIntervalsByDay.forEach((intervals) => {
                intervals.forEach((interval) => {
                    const start = Math.max(interval.start, WORK_START);
                    const end = Math.min(interval.end, WORK_END);
                    if (end <= start)
                        return;
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
            const morningTotalMinutes = 240 * 6; // 4 soat * 6 kun
            const afternoonTotalMinutes = 300 * 6; // 5 soat * 6 kun
            const morningFreeMinutes = morningTotalMinutes - morningBusyMinutes;
            const afternoonFreeMinutes = afternoonTotalMinutes - afternoonBusyMinutes;
            if (morningFreeMinutes > afternoonFreeMinutes && morningFreeMinutes > 0) {
                busiestFreePeriod = "Peshindan oldin";
            }
            else if (afternoonFreeMinutes > morningFreeMinutes && afternoonFreeMinutes > 0) {
                busiestFreePeriod = "Peshindan keyin";
            }
            else if (morningFreeMinutes > 0 && afternoonFreeMinutes > 0) {
                busiestFreePeriod = "Ham peshindan oldin, ham peshindan keyin";
            }
            return {
                ...room.toJSON(),
                schedules,
                occupancyPercentage: roundedPercentage,
                busiestFreePeriod,
            };
        }));
        return res.status(200).json(roomsWithOccupancy);
    }
    catch (error) {
        next(error);
    }
}
async function getOneRoom(req, res, next) {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const roomId = req.params.id;
        const room = await index_1.Room.findOne({
            where: (0, branch_scope_helper_1.withBranchScope)(req, { id: roomId }),
        });
        if (!room) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("room_not_found", { lng: lang })));
        }
        const schedules = await index_1.Schedule.findAll({
            where: { room_id: roomId },
            include: [
                { model: index_1.Group, as: "scheduleGroup", attributes: ["id", "group_subject"] },
                {
                    model: index_1.Teacher,
                    as: "teacher",
                    attributes: ["id", "first_name", "last_name"],
                },
            ],
        });
        const WORK_START = 9 * 60; // 09:00 => 540
        const WORK_END = 18 * 60; // 18:00 => 1080
        const WORK_HOURS_PER_DAY = 9;
        const WORK_DAYS = 6;
        const totalHours = WORK_HOURS_PER_DAY * WORK_DAYS;
        const busyMinutesByDay = new Map();
        schedules.forEach((schedule) => {
            const day = String(schedule.dataValues.day || "").trim().toLowerCase();
            if (isSunday(day))
                return;
            const [startHour, startMinute] = String(schedule.dataValues.start_time)
                .split(":")
                .map(Number);
            const [endHour, endMinute] = String(schedule.dataValues.end_time)
                .split(":")
                .map(Number);
            const startMinutes = startHour * 60 + startMinute;
            const endMinutes = endHour * 60 + endMinute;
            if (endMinutes <= startMinutes)
                return;
            if (!busyMinutesByDay.has(day)) {
                busyMinutesByDay.set(day, []);
            }
            busyMinutesByDay.get(day).push({
                start: startMinutes,
                end: endMinutes,
            });
        });
        let totalBusyMinutes = 0;
        const busyIntervalsByDay = new Map();
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
                }
                else {
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
        let morningBusyMinutes = 0; // 09:00 - 13:00
        let afternoonBusyMinutes = 0; // 13:00 - 18:00
        busyIntervalsByDay.forEach((intervals) => {
            intervals.forEach((interval) => {
                const start = Math.max(interval.start, WORK_START);
                const end = Math.min(interval.end, WORK_END);
                if (end <= start)
                    return;
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
        const morningTotalMinutes = 240 * 6; // 4 soat * 6 kun
        const afternoonTotalMinutes = 300 * 6; // 5 soat * 6 kun
        const morningFreeMinutes = morningTotalMinutes - morningBusyMinutes;
        const afternoonFreeMinutes = afternoonTotalMinutes - afternoonBusyMinutes;
        if (morningFreeMinutes > afternoonFreeMinutes && morningFreeMinutes > 0) {
            busiestFreePeriod = "Peshindan oldin";
        }
        else if (afternoonFreeMinutes > morningFreeMinutes && afternoonFreeMinutes > 0) {
            busiestFreePeriod = "Peshindan keyin";
        }
        else if (morningFreeMinutes > 0 && afternoonFreeMinutes > 0) {
            busiestFreePeriod = "Ham peshindan oldin, ham peshindan keyin";
        }
        const result = {
            ...room.toJSON(),
            schedules,
            occupancyPercentage: roundedPercentage,
            busiestFreePeriod,
        };
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}
async function createRoom(req, res, next) {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const { name, capacity, branch_id } = req.body;
        let finalBranchId = branch_id;
        // manager bo'lsa avtomatik
        if (req.user?.role === "manager") {
            finalBranchId = req.user.branch_id;
        }
        // director bo'lsa scope ichidan bo'lishi shart
        if (req.user?.role === "director") {
            if (!finalBranchId)
                return next(base_error_1.BaseError.BadRequest(400, "branch_id required"));
            if (!req.scope?.branchIds?.includes(finalBranchId)) {
                return next(base_error_1.BaseError.BadRequest(403, "Sizga ruxsat yo'q (branch scope)"));
            }
        }
        // superadmin bo'lsa branch_id talab qil (yoki default qoida o'zingda)
        if (req.user?.role === "superadmin" && !finalBranchId) {
            return next(base_error_1.BaseError.BadRequest(400, "branch_id required"));
        }
        const room = await index_1.Room.create({ name, capacity, branch_id: finalBranchId });
        res.status(201).json({
            message: lang_1.default.t("room_created", { lng: lang }),
            room,
        });
    }
    catch (error) {
        next(error);
    }
}
async function updateRoom(req, res, next) {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const { name, capacity, branch_id } = req.body;
        const room = await index_1.Room.findOne({
            where: (0, branch_scope_helper_1.withBranchScope)(req, { id: req.params.id }),
        });
        if (!room)
            return next(base_error_1.BaseError.BadRequest(404, "Room topilmadi yoki ruxsat yo'q"));
        if (!room) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("room_not_found", { lng: lang })));
        }
        await room.update({
            name,
            capacity,
        });
        res.status(200).json({
            message: lang_1.default.t("room_updated", { lng: lang }),
            room,
        });
    }
    catch (error) {
        next(error);
    }
}
async function deleteRoom(req, res, next) {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const room = await index_1.Room.findByPk(req.params.id);
        if (!room) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("room_not_found", { lng: lang })));
        }
        await room.destroy();
        res.status(200).json({
            message: lang_1.default.t("room_deleted", { lng: lang }),
        });
    }
    catch (error) {
        next(error);
    }
}
async function getAvailableRooms(req, res, next) {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const { day, start_time, end_time } = req.query;
        if (!day || !start_time || !end_time) {
            return next(base_error_1.BaseError.BadRequest(400, lang_1.default.t("missing_parameters", { lng: lang })));
        }
        const parsedDays = [day]; // day ni array sifatida ishlatsak, ko'p kunlarni ham qo'llab-quvvatlaydi
        const conflictingSchedules = await index_1.Schedule.findAll({
            where: {
                day: { [sequelize_1.Op.in]: parsedDays },
                [sequelize_1.Op.and]: [
                    { start_time: { [sequelize_1.Op.lt]: end_time } },
                    { end_time: { [sequelize_1.Op.gt]: start_time } },
                ],
            },
        });
        const busyRoomIds = conflictingSchedules.map((schedule) => schedule.dataValues.room_id);
        const availableRooms = await index_1.Room.findAll({
            where: (0, branch_scope_helper_1.withBranchScope)(req, {
                id: { [sequelize_1.Op.notIn]: busyRoomIds },
            }),
        });
        res.status(200).json(availableRooms);
    }
    catch (error) {
        next(error);
    }
}
async function getRoomsBusinessPercent(branchIds) {
    try {
        const roomWhere = branchIds?.length
            ? { branch_id: { [sequelize_1.Op.in]: branchIds } }
            : {};
        const rooms = await index_1.Room.findAll({
            where: roomWhere,
            attributes: ["id", "branch_id", "name"],
            include: [
                {
                    model: index_1.Schedule,
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
        for (const room of rooms) {
            const plainRoom = typeof room.get === "function" ? room.get({ plain: true }) : room;
            const schedules = Array.isArray(plainRoom.roomSchedules)
                ? plainRoom.roomSchedules
                : [];
            percent += calcOccupancy(schedules);
        }
        return Math.round(percent / rooms.length);
    }
    catch (error) {
        throw error;
    }
}
async function getRoomsBusinessPercentByBranch(branchIds) {
    const schedules = await index_1.Schedule.findAll({
        attributes: ["room_id", "day", "start_time", "end_time"],
        include: [
            {
                model: index_1.Room,
                as: "room",
                attributes: ["branch_id"],
                required: true,
                where: { branch_id: { [sequelize_1.Op.in]: branchIds } },
            },
        ],
        raw: true,
    });
    const roomMap = new Map();
    for (const s of schedules) {
        const roomId = s.room_id;
        if (!roomMap.has(roomId)) {
            roomMap.set(roomId, []);
        }
        roomMap.get(roomId).push(s);
    }
    const branchAgg = new Map();
    for (const [roomId, schedules] of roomMap) {
        const branchId = schedules[0]["room.branch_id"];
        const occ = calcOccupancy(schedules);
        const cur = branchAgg.get(branchId) ?? { sum: 0, count: 0 };
        cur.sum += occ;
        cur.count += 1;
        branchAgg.set(branchId, cur);
    }
    const result = new Map();
    for (const [branchId, data] of branchAgg) {
        result.set(branchId, Math.round(data.sum / data.count));
    }
    return result;
}
function calcOccupancy(schedules) {
    const WORK_START = 9 * 60; // 09:00 => 540
    const WORK_END = 18 * 60; // 18:00 => 1080
    const WORK_DAYS = 6;
    const totalMinutes = (WORK_END - WORK_START) * WORK_DAYS; // 540 * 6 = 3240
    const busyByDay = new Map();
    for (const s of schedules) {
        const day = String(s.day || "").trim().toLowerCase();
        if (isSunday(day))
            continue;
        const [sh, sm] = String(s.start_time).split(":").map(Number);
        const [eh, em] = String(s.end_time).split(":").map(Number);
        const start = sh * 60 + sm;
        const end = eh * 60 + em;
        if (end <= start)
            continue;
        if (!busyByDay.has(day)) {
            busyByDay.set(day, []);
        }
        busyByDay.get(day).push({ start, end });
    }
    let busyMinutes = 0;
    for (const intervals of busyByDay.values()) {
        if (!intervals.length)
            continue;
        intervals.sort((a, b) => a.start - b.start);
        const merged = [{ ...intervals[0] }];
        for (let i = 1; i < intervals.length; i++) {
            const cur = intervals[i];
            const last = merged[merged.length - 1];
            if (cur.start <= last.end) {
                last.end = Math.max(last.end, cur.end);
            }
            else {
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
async function getRoomStatsByBranch(branchIds) {
    const rooms = await index_1.Room.findAll({
        where: {
            branch_id: { [sequelize_1.Op.in]: branchIds },
        },
        attributes: ["id", "branch_id", "name"],
        include: [
            {
                model: index_1.Schedule,
                as: "roomSchedules",
                attributes: ["id"],
                required: false,
            },
        ],
    });
    const result = new Map();
    for (const room of rooms) {
        const plainRoom = typeof room.get === "function" ? room.get({ plain: true }) : room;
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
        }
        else {
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
