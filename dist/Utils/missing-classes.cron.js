"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAttendanceMissingNotifier = startAttendanceMissingNotifier;
const node_cron_1 = __importDefault(require("node-cron"));
const luxon_1 = require("luxon");
const sequelize_1 = require("sequelize");
const Models_1 = require("../Models");
const server_1 = require("../server");
const TZ = "Asia/Tashkent";
function mapNotificationColor(type) {
    switch (type) {
        case "danger":
            return "red";
        case "warning":
            return "yellow";
        case "success":
            return "green";
        default:
            return "blue";
    }
}
function startAttendanceMissingNotifier() {
    node_cron_1.default.schedule("*/5 * * * *", async () => {
        try {
            const now = luxon_1.DateTime.now().setZone(TZ);
            const todayStr = now.toISODate();
            const daysInUzbek = [
                "YAKSHANBA",
                "DUSHANBA",
                "SESHANBA",
                "CHORSHANBA",
                "PAYSHANBA",
                "JUMA",
                "SHANBA",
            ];
            const todayDayName = daysInUzbek[now.weekday % 7];
            const groups = await Models_1.Group.findAll({
                attributes: [
                    "id",
                    "group_subject",
                    "teacher_id",
                    "branch_id",
                    "start_time",
                    "end_time",
                    "days",
                ],
            });
            const todaysGroups = groups.filter((g) => String(g.days || "")
                .split("-")
                .map((d) => d.trim().toUpperCase())
                .includes(todayDayName));
            for (const group of todaysGroups) {
                const [endHour, endMinute] = String(group.end_time).split(":").map(Number);
                const classDeadline = luxon_1.DateTime.fromObject({
                    year: now.year,
                    month: now.month,
                    day: now.day,
                    hour: endHour,
                    minute: endMinute,
                }, { zone: TZ }).plus({ minutes: 30 });
                if (now < classDeadline)
                    continue;
                const existingAttendance = await Models_1.Attendance.findOne({
                    where: {
                        group_id: group.id,
                        date: todayStr,
                    },
                });
                if (existingAttendance)
                    continue;
                const targetUsers = await Models_1.User.findAll({
                    where: {
                        role: {
                            [sequelize_1.Op.in]: ["director"],
                        },
                        ...(group.branch_id ? { branch_id: group.branch_id } : {}),
                    },
                    attributes: ["id", "branch_id", "role"],
                });
                if (!targetUsers.length)
                    continue;
                const targetUserIds = targetUsers.map((u) => u.id);
                const settings = await Models_1.UserSettings.findAll({
                    where: {
                        user_id: targetUserIds,
                        teacher_attendance: true,
                    },
                    attributes: ["user_id"],
                });
                const enabledUserIds = new Set(settings.map((s) => s.user_id));
                const filteredUsers = targetUsers.filter((u) => enabledUserIds.has(u.id));
                if (!filteredUsers.length)
                    continue;
                const eventUniqueKey = `attendance_missing:${group.id}:${todayStr}`;
                const alreadySent = await Models_1.UserNotification.findAll({
                    where: {
                        user_id: {
                            [sequelize_1.Op.in]: filteredUsers.map((u) => u.id),
                        },
                        event_unique_key: eventUniqueKey,
                    },
                    attributes: ["user_id"],
                });
                const alreadySentUserIds = new Set(alreadySent.map((n) => n.user_id));
                const notificationsPayload = filteredUsers
                    .filter((u) => !alreadySentUserIds.has(u.id))
                    .map((user) => ({
                    user_id: user.id,
                    title: "Yo'qlama qilinmadi",
                    message: `${group.group_subject || "Guruh"} guruhi uchun bugungi yo'qlama hali qilinmagan`,
                    type: "warning",
                    is_read: false,
                    event_key: "attendance_missing",
                    event_unique_key: eventUniqueKey,
                    meta: {
                        group_id: group.id,
                        branch_id: group.branch_id,
                        teacher_id: group.teacher_id,
                        date: todayStr,
                    },
                }));
                if (!notificationsPayload.length)
                    continue;
                const createdNotifications = await Models_1.UserNotification.bulkCreate(notificationsPayload, { returning: true });
                if (server_1.io && createdNotifications.length > 0) {
                    for (const notification of createdNotifications) {
                        const roomName = `user:${notification.user_id}`;
                        server_1.io.to(roomName).emit("new-notification", {
                            id: notification.id,
                            user_id: notification.user_id,
                            title: notification.title,
                            message: notification.message,
                            type: notification.type,
                            color: mapNotificationColor(notification.type),
                            isRead: Boolean(notification.is_read),
                            createdAt: notification.created_at,
                            timeAgo: "Hozirgina",
                            meta: notification.meta ?? null,
                        });
                    }
                }
            }
        }
        catch (error) {
            console.error("Attendance missing notifier error:", error);
        }
    }, {
        timezone: TZ,
    });
}
