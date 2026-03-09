import { Request, Response, NextFunction } from "express";
import { Op, fn, col, literal, Sequelize } from "sequelize";
import { DateTime } from "luxon";
import { Student, Payment, AttendanceRecord, Attendance, Group, User, UserSettings, UserNotification } from "../Models";
import { withBranchScope } from "../Utils/branch_scope.helper";
import { io } from "../server";

async function getDailyReport(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
        const date =
            String(req.query.date || DateTime.now().setZone("Asia/Tashkent").toISODate());

        const totalStudents = await Student.count({
            where: withBranchScope(req),
        });

        const newStudents = await Student.count({
            where: {
                ...withBranchScope(req),
                [Op.and]: [Sequelize.where(fn("DATE", col("Student.created_at")), date)],
            },
        });

        const payments = await Payment.findAll({
            where: {
                ...withBranchScope(req),
                [Op.and]: [Sequelize.where(fn("DATE", col("Payment.created_at")), date)]
            },
            order: [["created_at", "DESC"]],
            limit: 10,
            include: [
                {
                    model: Group,
                    as: "paymentGroup",
                    attributes: ["group_subject"],
                },
            ],
        });

        const totalPayments = payments.reduce(
            (sum: number, p: any) => sum + Number(p.payment_amount || 0),
            0
        );

        const attendanceStats = (await AttendanceRecord.findOne({
            attributes: [
                [fn("SUM", literal(`CASE WHEN status = 'present' THEN 1 ELSE 0 END`)), "present"],
                [fn("COUNT", col("AttendanceRecord.id")), "total"],
            ],
            include: [
                {
                    model: Attendance,
                    as: "attendance",
                    required: true,
                    where: { date },
                    include: [
                        {
                            model: Group,
                            as: "group",
                            required: true,
                            where: withBranchScope(req),
                            attributes: [],
                        },
                    ],
                    attributes: [],
                },
            ],
            raw: true,
        })) as any;

        const present = Number(attendanceStats?.present || 0);
        const total = Number(attendanceStats?.total || 0);
        const attendancePercent = total > 0 ? Math.round((present / total) * 100) : 0;

        res.status(200).json({
            date,
            totalStudents,
            newStudents,
            totalPayments,
            attendancePercent,
            latestPayments: payments.map((p: any) => ({
                id: p.id,
                amount: p.payment_amount,
                group_name: p.paymentGroup?.group_subject || "Noma'lum guruh",
                created_at: p.created_at,
            })),
        });
        return;
    } catch (e) {
        next(e);
    }
}

async function getWeeklyReport(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
        const start = String(req.query.start);
        const end = String(req.query.end);

        if (!start || !end) {
            res.status(400).json({ message: "start va end kerak" });
            return;
        }

        const totalStudents = await Student.count({
            where: withBranchScope(req),
        });

        const newStudents = await Student.count({
            where: {
                ...withBranchScope(req),
                created_at: {
                    [Op.between]: [
                        `${start} 00:00:00`,
                        `${end} 23:59:59`,
                    ],
                },
            },
        });

        const payments = await Payment.findAll({
            where: {
                ...withBranchScope(req),
                created_at: {
                    [Op.between]: [
                        `${start} 00:00:00`,
                        `${end} 23:59:59`,
                    ],
                },
            },
            order: [["created_at", "DESC"]],
            limit: 20,
            include: [
                {
                    model: Group,
                    as: "paymentGroup",
                    attributes: ["group_subject"],
                },
            ],
        });

        const totalPayments = payments.reduce(
            (sum: number, p: any) => sum + Number(p.payment_amount || 0),
            0
        );

        const attendanceStats = (await AttendanceRecord.findOne({
            attributes: [
                [fn("SUM", literal(`CASE WHEN status = 'present' THEN 1 ELSE 0 END`)), "present"],
                [fn("COUNT", col("AttendanceRecord.id")), "total"],
            ],
            include: [
                {
                    model: Attendance,
                    as: "attendance",
                    required: true,
                    where: {
                        date: { [Op.between]: [start, end] },
                    },
                    include: [
                        {
                            model: Group,
                            as: "group",
                            required: true,
                            where: withBranchScope(req),
                            attributes: [],
                        },
                    ],
                    attributes: [],
                },
            ],
            raw: true,
        })) as any;

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
            latestPayments: payments.map((p: any) => ({
                id: p.id,
                amount: p.payment_amount,
                group_name: p.paymentGroup?.group_subject || "Noma'lum guruh",
                created_at: p.created_at,
            })),
        });
        return;
    } catch (e) {
        next(e);
    }
}

function mapNotificationColor(type: string) {
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

async function testDailyReportNotification(
    req: any,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const now = DateTime.now().setZone("Asia/Tashkent");
        const reportDate = now.toISODate();

        const users = await User.findAll({
            where: { role: "director" },
            attributes: ["id"],
        });

        const userIds = users.map((u: any) => u.id);

        const settings = await UserSettings.findAll({
            where: {
                user_id: userIds,
                daily_report: true,
            },
            attributes: ["user_id"],
        });

        const enabledUserIds = new Set(settings.map((s: any) => s.user_id));

        const payload = users
            .filter((u: any) => enabledUserIds.has(u.id))
            .map((user: any) => ({
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

        const createdNotifications =
            payload.length > 0
                ? await UserNotification.bulkCreate(payload, { returning: true })
                : [];

        if (io && createdNotifications.length > 0) {
            for (const notification of createdNotifications as any[]) {
                io.to(`user:${notification.user_id}`).emit("new-notification", {
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
    } catch (error) {
        next(error);
        return;
    }
}

async function testWeeklyReportNotification(
    req: any,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const now = DateTime.now().setZone("Asia/Tashkent");
        const previousWeek = now.minus({ weeks: 1 });

        const weekStart = previousWeek.startOf("week").toISODate();
        const weekEnd = previousWeek.endOf("week").toISODate();

        const users = await User.findAll({
            where: { role: "director" },
            attributes: ["id"],
        });

        const userIds = users.map((u: any) => u.id);

        const settings = await UserSettings.findAll({
            where: {
                user_id: userIds,
                weekly_report: true,
            },
            attributes: ["user_id"],
        });

        const enabledUserIds = new Set(settings.map((s: any) => s.user_id));

        const payload = users
            .filter((u: any) => enabledUserIds.has(u.id))
            .map((user: any) => ({
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

        const createdNotifications =
            payload.length > 0
                ? await UserNotification.bulkCreate(payload, { returning: true })
                : [];

        if (io && createdNotifications.length > 0) {
            for (const notification of createdNotifications as any[]) {
                io.to(`user:${notification.user_id}`).emit("new-notification", {
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
    } catch (error) {
        next(error);
        return;
    }
}

export { getDailyReport, getWeeklyReport, testDailyReportNotification, testWeeklyReportNotification };