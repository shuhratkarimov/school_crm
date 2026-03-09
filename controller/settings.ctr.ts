import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Branch, User, UserSettings } from "../Models/index";
import { ok } from "../Utils/apiResponse";
import { BaseError } from "../Utils/base_error";

async function ensureUserSettings(userId: string) {
    let settings = await UserSettings.findOne({
        where: { user_id: userId },
    });

    if (!settings) {
        settings = await UserSettings.create({
            user_id: userId,
        });
    }

    return settings;
}

function getBranchLabel(branches: any[]) {
    if (!branches?.length) return "Bosh ofis";
    if (branches.length === 1) return branches[0]?.name ?? "Bosh ofis";
    return branches.map((b) => b.name).filter(Boolean).join(", ");
}

async function getMySettings(
    req: any,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(BaseError.BadRequest(401, "Unauthorized"));
        }

        const user = await User.findByPk(userId, {
            attributes: ["id", "username", "email", "role", "branch_id"],
        });

        if (!user) {
            return next(BaseError.BadRequest(404, "Foydalanuvchi topilmadi"));
        }

        const settings = await ensureUserSettings(userId);

        const scopeBranchIds = req.scope?.branchIds ?? [];
        const branches = scopeBranchIds.length
            ? await Branch.findAll({
                where: { id: scopeBranchIds },
                attributes: ["id", "name"],
            })
            : [];

        const plainUser =
            typeof user.get === "function" ? user.get({ plain: true }) : user;
        const plainSettings =
            typeof settings.get === "function"
                ? settings.get({ plain: true })
                : settings;

        return void res.status(200).json(
            ok(
                {
                    profile: {
                        fullName:
                            plainUser.username || "Foydalanuvchi",
                        email: plainUser.email || "",
                        phone: plainSettings.phone || "",
                        address: plainSettings.address || "",
                        branch: getBranchLabel(branches),
                        avatar: plainSettings.avatar || null,
                        role: plainUser.role || "",
                    },
                    notifications: {
                        emailNotifications: Boolean(plainSettings.email_notifications),
                        pushNotifications: Boolean(plainSettings.push_notifications),
                        debtAlerts: Boolean(plainSettings.debt_alerts),
                        studentRegistration: Boolean(plainSettings.student_registration),
                        paymentAlerts: Boolean(plainSettings.payment_alerts),
                        teacherAttendance: Boolean(plainSettings.teacher_attendance),
                        dailyReport: Boolean(plainSettings.daily_report),
                        weeklyReport: Boolean(plainSettings.weekly_report),
                    },
                    preferences: {
                        language: plainSettings.language || "uz",
                        theme: plainSettings.theme || "light",
                    },
                },
                "Settings fetched"
            )
        );
    } catch (e) {
        next(e);
    }
}

async function updateMyProfile(
    req: any,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(BaseError.BadRequest(401, "Unauthorized"));
        }

        const { fullName, email, phone, address, avatar } = req.body ?? {};

        if (!fullName || !String(fullName).trim()) {
            return next(BaseError.BadRequest(400, "To'liq ism majburiy"));
        }

        if (!email || !String(email).trim()) {
            return next(BaseError.BadRequest(400, "Email majburiy"));
        }

        const emailRegex = /\S+@\S+\.\S+/;
        if (!emailRegex.test(String(email).trim())) {
            return next(BaseError.BadRequest(400, "Email noto'g'ri"));
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return next(BaseError.BadRequest(404, "Foydalanuvchi topilmadi"));
        }

        const existingUser = await User.findOne({
            where: { email: String(email).trim() },
        });

        if (
            existingUser &&
            String((existingUser as any).id) !== String(userId)
        ) {
            return next(BaseError.BadRequest(400, "Bu email allaqachon band"));
        }

        const settings = await ensureUserSettings(userId);

        await user.update({
            full_name: String(fullName).trim(),
            email: String(email).trim(),
        });

        await settings.update({
            phone: phone ? String(phone).trim() : "",
            address: address ? String(address).trim() : "",
            avatar: avatar ?? null,
        });

        return void res.status(200).json(
            ok(
                {
                    profile: {
                        fullName: String(fullName).trim(),
                        email: String(email).trim(),
                        phone: phone ? String(phone).trim() : "",
                        address: address ? String(address).trim() : "",
                        avatar: avatar ?? null,
                    },
                },
                "Profil muvaffaqiyatli yangilandi"
            )
        );
    } catch (e) {
        next(e);
    }
}

async function updateMyPassword(
    req: any,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(BaseError.BadRequest(401, "Unauthorized"));
        }

        const { currentPassword, newPassword, confirmPassword } = req.body ?? {};

        if (!currentPassword) {
            return next(BaseError.BadRequest(400, "Joriy parolni kiriting"));
        }

        if (!newPassword) {
            return next(BaseError.BadRequest(400, "Yangi parolni kiriting"));
        }

        if (String(newPassword).length < 6) {
            return next(
                BaseError.BadRequest(400, "Parol kamida 6 belgidan iborat bo'lishi kerak")
            );
        }

        if (String(newPassword) !== String(confirmPassword)) {
            return next(BaseError.BadRequest(400, "Parollar mos kelmadi"));
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return next(BaseError.BadRequest(404, "Foydalanuvchi topilmadi"));
        }

        const passwordHash = (user as any).password;
        const isMatch = await bcrypt.compare(String(currentPassword), passwordHash);

        if (!isMatch) {
            return next(BaseError.BadRequest(400, "Joriy parol noto'g'ri"));
        }

        const hashedPassword = await bcrypt.hash(String(newPassword), 10);

        await user.update({
            password: hashedPassword,
        });

        return void res.status(200).json(
            ok(null, "Parol muvaffaqiyatli o'zgartirildi")
        );
    } catch (e) {
        next(e);
    }
}

async function updateMyNotifications(
    req: any,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(BaseError.BadRequest(401, "Unauthorized"));
        }

        const settings = await ensureUserSettings(userId);

        const {
            emailNotifications,
            pushNotifications,
            debtAlerts,
            studentRegistration,
            paymentAlerts,
            teacherAttendance,
            dailyReport,
            weeklyReport,
        } = req.body ?? {};

        await settings.update({
            email_notifications: Boolean(emailNotifications),
            push_notifications: Boolean(pushNotifications),
            debt_alerts: Boolean(debtAlerts),
            student_registration: Boolean(studentRegistration),
            payment_alerts: Boolean(paymentAlerts),
            teacher_attendance: Boolean(teacherAttendance),
            daily_report: Boolean(dailyReport),
            weekly_report: Boolean(weeklyReport),
        });

        return void res.status(200).json(
            ok(
                {
                    notifications: {
                        emailNotifications: Boolean(emailNotifications),
                        pushNotifications: Boolean(pushNotifications),
                        debtAlerts: Boolean(debtAlerts),
                        studentRegistration: Boolean(studentRegistration),
                        paymentAlerts: Boolean(paymentAlerts),
                        teacherAttendance: Boolean(teacherAttendance),
                        dailyReport: Boolean(dailyReport),
                        weeklyReport: Boolean(weeklyReport),
                    },
                },
                "Bildirishnoma sozlamalari saqlandi"
            )
        );
    } catch (e) {
        next(e);
    }
}

async function updateMyPreferences(
    req: any,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(BaseError.BadRequest(401, "Unauthorized"));
        }

        const { language, theme } = req.body ?? {};

        const allowedLanguages = ["uz", "en", "ru"];
        const allowedThemes = ["light", "dark"];

        if (language && !allowedLanguages.includes(language)) {
            return next(BaseError.BadRequest(400, "Til noto'g'ri"));
        }

        if (theme && !allowedThemes.includes(theme)) {
            return next(BaseError.BadRequest(400, "Theme noto'g'ri"));
        }

        const settings = await ensureUserSettings(userId);

        await settings.update({
            language: language || settings.get("language"),
            theme: theme || settings.get("theme"),
        });

        return void res.status(200).json(
            ok(
                {
                    preferences: {
                        language: language || settings.get("language"),
                        theme: theme || settings.get("theme"),
                    },
                },
                "Sozlamalar saqlandi"
            )
        );
    } catch (e) {
        next(e);
    }
}

export {
    getMySettings,
    updateMyProfile,
    updateMyPassword,
    updateMyNotifications,
    updateMyPreferences,
};