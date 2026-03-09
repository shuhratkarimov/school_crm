"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyNotifications = getMyNotifications;
exports.markAllNotificationsRead = markAllNotificationsRead;
exports.markNotificationRead = markNotificationRead;
exports.testSocketNotification = testSocketNotification;
const index_1 = require("../Models/index");
const apiResponse_1 = require("../Utils/apiResponse");
const base_error_1 = require("../Utils/base_error");
const server_1 = require("../server");
const sequelize_1 = require("sequelize");
function formatRelativeTime(dateInput) {
    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);
    if (diffMin < 1)
        return "Hozirgina";
    if (diffMin < 60)
        return `${diffMin} daqiqa oldin`;
    if (diffHour < 24)
        return `${diffHour} soat oldin`;
    if (diffDay < 7)
        return `${diffDay} kun oldin`;
    return date.toLocaleDateString("uz-UZ");
}
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
async function getMyNotifications(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(base_error_1.BaseError.BadRequest(401, "Unauthorized"));
        }
        const notifications = await index_1.UserNotification.findAll({
            where: { user_id: userId },
            order: [["created_at", "DESC"]],
            limit: 20,
        });
        const unreadCount = await index_1.UserNotification.count({
            where: {
                user_id: userId,
                [sequelize_1.Op.or]: [{ is_read: false }, { is_read: null }],
            },
        });
        const rows = notifications.map((item) => {
            const plain = typeof item.get === "function" ? item.get({ plain: true }) : item;
            return {
                id: plain.id,
                title: plain.title,
                message: plain.message,
                type: plain.type,
                color: mapNotificationColor(plain.type),
                isRead: Boolean(plain.is_read),
                createdAt: plain.created_at,
                timeAgo: formatRelativeTime(plain.created_at),
                meta: plain.meta ?? null,
            };
        });
        return void res.status(200).json((0, apiResponse_1.ok)({
            unreadCount,
            notifications: rows,
        }, "Notifications fetched"));
    }
    catch (e) {
        next(e);
    }
}
async function markAllNotificationsRead(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(base_error_1.BaseError.BadRequest(401, "Unauthorized"));
        }
        const [updatedCount] = await index_1.UserNotification.update({ is_read: true }, {
            where: {
                user_id: userId,
                [sequelize_1.Op.or]: [{ is_read: false }, { is_read: null }],
            },
        });
        return void res.status(200).json((0, apiResponse_1.ok)({ updatedCount }, "Barcha bildirishnomalar o‘qildi"));
    }
    catch (e) {
        next(e);
    }
}
async function markNotificationRead(req, res, next) {
    try {
        const userId = req.user?.id;
        const notificationId = req.params.id;
        if (!userId) {
            return next(base_error_1.BaseError.BadRequest(401, "Unauthorized"));
        }
        const notification = await index_1.UserNotification.findOne({
            where: {
                id: notificationId,
                user_id: userId,
            },
        });
        if (!notification) {
            return next(base_error_1.BaseError.BadRequest(404, "Bildirishnoma topilmadi"));
        }
        await notification.update({ is_read: true });
        return void res.status(200).json((0, apiResponse_1.ok)(null, "Bildirishnoma o‘qildi"));
    }
    catch (e) {
        next(e);
    }
}
async function testSocketNotification(req, res) {
    const userId = "84e76abb-d473-4606-b230-3455dc4282e7";
    const roomName = `user:${userId}`;
    const socketsInRoom = await server_1.io.in(roomName).fetchSockets();
    console.log("TEST ROOM:", roomName);
    console.log("TEST SOCKETS:", socketsInRoom.map((s) => s.id));
    server_1.io.to(roomName).emit("new-notification", {
        title: "Test notification",
        message: "Socket test ishladi",
        type: "success",
        meta: null,
    });
    res.status(200).json({ ok: true });
}
