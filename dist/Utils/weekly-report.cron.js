"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWeeklyReportNotifier = startWeeklyReportNotifier;
const node_cron_1 = __importDefault(require("node-cron"));
const luxon_1 = require("luxon");
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
function startWeeklyReportNotifier() {
    node_cron_1.default.schedule("0 20 * * 0", async () => {
        try {
            const now = luxon_1.DateTime.now().setZone(TZ);
            const weekStart = now.startOf("week").toISODate();
            const weekEnd = now.endOf("week").toISODate();
            const users = await Models_1.User.findAll({
                attributes: ["id"],
            });
            const userIds = users.map((u) => u.id);
            const settings = await Models_1.UserSettings.findAll({
                where: {
                    user_id: userIds,
                    weekly_report: true,
                },
                attributes: ["user_id"],
            });
            const enabledUserIds = new Set(settings.map((s) => s.user_id));
            const notificationsPayload = users
                .filter((u) => enabledUserIds.has(u.id))
                .map((user) => ({
                user_id: user.id,
                title: "Haftalik hisobot tayyor",
                message: "Haftalik natijalarni ko'rish uchun bosing",
                type: "info",
                is_read: false,
                event_key: "weekly_report",
                event_unique_key: `weekly_report:${weekStart}:${weekEnd}:${user.id}`,
                meta: {
                    report_type: "weekly",
                    week_start: weekStart,
                    week_end: weekEnd,
                },
            }));
            const createdNotifications = notificationsPayload.length > 0
                ? await Models_1.UserNotification.bulkCreate(notificationsPayload, {
                    returning: true,
                })
                : [];
            if (server_1.io && createdNotifications.length > 0) {
                for (const notification of createdNotifications) {
                    server_1.io.to(`user:${notification.user_id}`).emit("new-notification", {
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
        catch (error) {
            console.error("Weekly report cron error:", error);
        }
    }, { timezone: TZ });
}
