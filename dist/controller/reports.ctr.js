"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDailyReport = getDailyReport;
exports.getWeeklyReport = getWeeklyReport;
exports.testDailyReportNotification = testDailyReportNotification;
exports.testWeeklyReportNotification = testWeeklyReportNotification;
const sequelize_1 = require("sequelize");
const luxon_1 = require("luxon");
const Models_1 = require("../Models");
const branch_scope_helper_1 = require("../Utils/branch_scope.helper");
const server_1 = require("../server");
async function getDailyReport(req, res, next) {
    try {
        const date = String(req.query.date || luxon_1.DateTime.now().setZone("Asia/Tashkent").toISODate());
        const totalStudents = await Models_1.Student.count({
            where: (0, branch_scope_helper_1.withBranchScope)(req),
        });
        const newStudents = await Models_1.Student.count({
            where: {
                ...(0, branch_scope_helper_1.withBranchScope)(req),
                [sequelize_1.Op.and]: [sequelize_1.Sequelize.where((0, sequelize_1.fn)("DATE", (0, sequelize_1.col)("Student.created_at")), date)],
            },
        });
        const payments = await Models_1.Payment.findAll({
            where: {
                ...(0, branch_scope_helper_1.withBranchScope)(req),
                [sequelize_1.Op.and]: [sequelize_1.Sequelize.where((0, sequelize_1.fn)("DATE", (0, sequelize_1.col)("Payment.created_at")), date)]
            },
            order: [["created_at", "DESC"]],
            limit: 10,
            include: [
                {
                    model: Models_1.Group,
                    as: "paymentGroup",
                    attributes: ["group_subject"],
                },
            ],
        });
        const totalPayments = payments.reduce((sum, p) => sum + Number(p.payment_amount || 0), 0);
        const attendanceStats = (await Models_1.AttendanceRecord.findOne({
            attributes: [
                [(0, sequelize_1.fn)("SUM", (0, sequelize_1.literal)(`CASE WHEN status = 'present' THEN 1 ELSE 0 END`)), "present"],
                [(0, sequelize_1.fn)("COUNT", (0, sequelize_1.col)("AttendanceRecord.id")), "total"],
            ],
            include: [
                {
                    model: Models_1.Attendance,
                    as: "attendance",
                    required: true,
                    where: { date },
                    include: [
                        {
                            model: Models_1.Group,
                            as: "group",
                            required: true,
                            where: (0, branch_scope_helper_1.withBranchScope)(req),
                            attributes: [],
                        },
                    ],
                    attributes: [],
                },
            ],
            raw: true,
        }));
        const present = Number(attendanceStats?.present || 0);
        const total = Number(attendanceStats?.total || 0);
        const attendancePercent = total > 0 ? Math.round((present / total) * 100) : 0;
        res.status(200).json({
            date,
            totalStudents,
            newStudents,
            totalPayments,
            attendancePercent,
            latestPayments: payments.map((p) => ({
                id: p.id,
                amount: p.payment_amount,
                group_name: p.paymentGroup?.group_subject || "Noma'lum guruh",
                created_at: p.created_at,
            })),
        });
        return;
    }
    catch (e) {
        next(e);
    }
}
async function getWeeklyReport(req, res, next) {
    try {
        const start = String(req.query.start);
        const end = String(req.query.end);
        if (!start || !end) {
            res.status(400).json({ message: "start va end kerak" });
            return;
        }
        const totalStudents = await Models_1.Student.count({
            where: (0, branch_scope_helper_1.withBranchScope)(req),
        });
        const newStudents = await Models_1.Student.count({
            where: {
                ...(0, branch_scope_helper_1.withBranchScope)(req),
                created_at: {
                    [sequelize_1.Op.between]: [
                        `${start} 00:00:00`,
                        `${end} 23:59:59`,
                    ],
                },
            },
        });
        const payments = await Models_1.Payment.findAll({
            where: {
                ...(0, branch_scope_helper_1.withBranchScope)(req),
                created_at: {
                    [sequelize_1.Op.between]: [
                        `${start} 00:00:00`,
                        `${end} 23:59:59`,
                    ],
                },
            },
            order: [["created_at", "DESC"]],
            limit: 20,
            include: [
                {
                    model: Models_1.Group,
                    as: "paymentGroup",
                    attributes: ["group_subject"],
                },
            ],
        });
        const totalPayments = payments.reduce((sum, p) => sum + Number(p.payment_amount || 0), 0);
        const attendanceStats = (await Models_1.AttendanceRecord.findOne({
            attributes: [
                [(0, sequelize_1.fn)("SUM", (0, sequelize_1.literal)(`CASE WHEN status = 'present' THEN 1 ELSE 0 END`)), "present"],
                [(0, sequelize_1.fn)("COUNT", (0, sequelize_1.col)("AttendanceRecord.id")), "total"],
            ],
            include: [
                {
                    model: Models_1.Attendance,
                    as: "attendance",
                    required: true,
                    where: {
                        date: { [sequelize_1.Op.between]: [start, end] },
                    },
                    include: [
                        {
                            model: Models_1.Group,
                            as: "group",
                            required: true,
                            where: (0, branch_scope_helper_1.withBranchScope)(req),
                            attributes: [],
                        },
                    ],
                    attributes: [],
                },
            ],
            raw: true,
        }));
        const present = Number(attendanceStats?.present || 0);
        const total = Number(attendanceStats?.total || 0);
        const attendancePercent = total > 0 ? Math.round((present / total) * 100) : 0;
        res.status(200).json({
            start,
            end,
            totalStudents,
            newStudents,
            totalPayments,
            attendancePercent,
            latestPayments: payments.map((p) => ({
                id: p.id,
                amount: p.payment_amount,
                group_name: p.paymentGroup?.group_subject || "Noma'lum guruh",
                created_at: p.created_at,
            })),
        });
        return;
    }
    catch (e) {
        next(e);
    }
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
async function testDailyReportNotification(req, res, next) {
    try {
        const now = luxon_1.DateTime.now().setZone("Asia/Tashkent");
        const reportDate = now.toISODate();
        const users = await Models_1.User.findAll({
            where: { role: "director" },
            attributes: ["id"],
        });
        const userIds = users.map((u) => u.id);
        const settings = await Models_1.UserSettings.findAll({
            where: {
                user_id: userIds,
                daily_report: true,
            },
            attributes: ["user_id"],
        });
        const enabledUserIds = new Set(settings.map((s) => s.user_id));
        const payload = users
            .filter((u) => enabledUserIds.has(u.id))
            .map((user) => ({
            user_id: user.id,
            title: "Kunlik hisobot tayyor",
            message: "Bugungi hisobotni ko'rish uchun bosing",
            type: "info",
            is_read: false,
            event_key: "daily_report",
            event_unique_key: `daily_report:test:${reportDate}:${user.id}:${Date.now()}`,
            meta: {
                report_type: "daily",
                report_date: reportDate,
            },
        }));
        const createdNotifications = payload.length > 0
            ? await Models_1.UserNotification.bulkCreate(payload, { returning: true })
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
        res.status(200).json({
            message: "Daily report test notification yuborildi",
            count: createdNotifications.length,
        });
        return;
    }
    catch (error) {
        next(error);
        return;
    }
}
async function testWeeklyReportNotification(req, res, next) {
    try {
        const now = luxon_1.DateTime.now().setZone("Asia/Tashkent");
        const previousWeek = now.minus({ weeks: 1 });
        const weekStart = previousWeek.startOf("week").toISODate();
        const weekEnd = previousWeek.endOf("week").toISODate();
        const users = await Models_1.User.findAll({
            where: { role: "director" },
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
        const payload = users
            .filter((u) => enabledUserIds.has(u.id))
            .map((user) => ({
            user_id: user.id,
            title: "Haftalik hisobot tayyor",
            message: "Haftalik natijalarni ko'rish uchun bosing",
            type: "info",
            is_read: false,
            event_key: "weekly_report",
            event_unique_key: `weekly_report:test:${weekStart}:${weekEnd}:${user.id}:${Date.now()}`,
            meta: {
                report_type: "weekly",
                week_start: weekStart,
                week_end: weekEnd,
            },
        }));
        const createdNotifications = payload.length > 0
            ? await Models_1.UserNotification.bulkCreate(payload, { returning: true })
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
        res.status(200).json({
            message: "Weekly report test notification yuborildi",
            count: createdNotifications.length,
        });
        return;
    }
    catch (error) {
        next(error);
        return;
    }
}
