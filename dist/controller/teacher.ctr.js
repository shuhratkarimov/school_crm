"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeachers = getTeachers;
exports.getOneTeacher = getOneTeacher;
exports.createTeacher = createTeacher;
exports.updateTeacher = updateTeacher;
exports.deleteTeacher = deleteTeacher;
exports.teacherLogin = teacherLogin;
exports.getTeacherGroups = getTeacherGroups;
exports.createPayment = createPayment;
exports.getTeacherBalance = getTeacherBalance;
exports.updateTeacherBalance = updateTeacherBalance;
exports.getTeacherPayments = getTeacherPayments;
exports.getTeacherData = getTeacherData;
exports.getTeacherDashboardStudentPayments = getTeacherDashboardStudentPayments;
exports.teacherLogout = teacherLogout;
exports.getTeacherSalaries = getTeacherSalaries;
const teacher_model_1 = __importDefault(require("../Models/teacher_model"));
const base_error_1 = require("../Utils/base_error");
const i18next_1 = __importDefault(require("i18next"));
const Models_1 = require("../Models");
const teacher_payment_model_1 = __importDefault(require("../Models/teacher-payment.model"));
const teacher_balance_model_1 = __importDefault(require("../Models/teacher-balance.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const payments_ctr_1 = require("./payments.ctr");
const sequelize_1 = require("sequelize");
const branch_scope_helper_1 = require("../Utils/branch_scope.helper");
async function getTeachers(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const teachers = await teacher_model_1.default.findAll({ where: (0, branch_scope_helper_1.withBranchScope)(req) });
        if (teachers.length === 0) {
            return next(base_error_1.BaseError.BadRequest(404, i18next_1.default.t("TEACHERS_NOT_FOUND", { lng: lang })));
        }
        res.status(200).json(teachers);
    }
    catch (error) {
        next(error);
    }
}
async function getOneTeacher(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const teacher = await teacher_model_1.default.findOne({
            where: (0, branch_scope_helper_1.withBranchScope)(req, { id: req.params.id }),
        });
        if (!teacher) {
            return next(base_error_1.BaseError.BadRequest(404, i18next_1.default.t("TEACHER_NOT_FOUND", { lng: lang })));
        }
        res.status(200).json(teacher);
    }
    catch (error) {
        next(error);
    }
}
async function createTeacher(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const { first_name, last_name, father_name, birth_date, phone_number, subject, username, password, } = req.body;
        const teacher = await teacher_model_1.default.create({
            first_name,
            last_name,
            father_name,
            birth_date,
            phone_number,
            subject,
            username,
            password,
            branch_id: req.user?.branch_id,
        });
        res.status(200).json(teacher);
    }
    catch (error) {
        next(error);
    }
}
async function updateTeacher(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const { first_name, last_name, father_name, birth_date, phone_number, subject, username, password, } = req.body;
        const teacher = await teacher_model_1.default.findOne({
            where: (0, branch_scope_helper_1.withBranchScope)(req, { id: req.params.id }),
        });
        if (!teacher) {
            return next(base_error_1.BaseError.BadRequest(404, "Ustoz topilmadi"));
        }
        let hashedPassword;
        if (password) {
            hashedPassword = await bcryptjs_1.default.hash(password, 12);
        }
        const foundUsername = await teacher_model_1.default.findOne({
            where: { username },
        });
        if (foundUsername && foundUsername.dataValues.id !== teacher.dataValues.id) {
            return next(base_error_1.BaseError.BadRequest(404, "Bunday foydalanuvchi nomi mavjud!\nIltimos boshqa nomni tanlang"));
        }
        await teacher.update({
            first_name,
            last_name,
            father_name,
            birth_date,
            phone_number,
            subject,
            username,
            password: hashedPassword,
        });
        res.status(200).json(teacher);
    }
    catch (error) {
        next(error);
    }
}
async function deleteTeacher(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const teacher = await teacher_model_1.default.findOne({
            where: (0, branch_scope_helper_1.withBranchScope)(req, { id: req.params.id }),
        });
        if (!teacher) {
            return next(base_error_1.BaseError.BadRequest(404, "Ustoz topilmadi"));
        }
        await teacher_payment_model_1.default.destroy({
            where: { teacher_id: teacher.dataValues.id }
        });
        await teacher_balance_model_1.default.destroy({
            where: { teacher_id: teacher.dataValues.id }
        });
        await teacher.destroy();
        res.status(200).json({
            message: "Ustoz o'chirildi",
        });
    }
    catch (error) {
        next(error);
    }
}
async function getTeacherData(req, res, next) {
    try {
        const token = req.cookies.accesstoken;
        if (!token) {
            return next(base_error_1.BaseError.BadRequest(404, "Token topilmadi"));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_SECRET_KEY);
            const teacherId = decoded.id;
            const teacher = await teacher_model_1.default.findByPk(teacherId);
            res.status(200).json(teacher);
        }
        catch (error) {
            next(error);
        }
    }
    catch (error) {
        next(error);
    }
}
async function getTeacherGroups(req, res, next) {
    try {
        const token = req.cookies.accesstoken;
        if (!token) {
            return next(base_error_1.BaseError.BadRequest(404, "Token topilmadi"));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_SECRET_KEY);
            const teacherId = decoded.id;
            const groups = await Models_1.Group.findAll({
                where: { teacher_id: teacherId },
                attributes: ["id", "group_subject", "days", "start_time", "end_time"],
            });
            res.status(200).json(groups);
        }
        catch (error) {
            next(error);
        }
    }
    catch (error) {
        next(error);
    }
}
async function teacherLogin(req, res, next) {
    try {
        const { username, password } = req.body;
        const teacher = await teacher_model_1.default.findOne({
            where: { username },
        });
        if (!teacher) {
            return next(base_error_1.BaseError.BadRequest(404, "Ustoz topilmadi"));
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, teacher.dataValues.password);
        if (!isPasswordValid) {
            return next(base_error_1.BaseError.BadRequest(404, "Parol xato"));
        }
        const payload = {
            id: teacher.dataValues.id,
            username: teacher.dataValues.username,
        };
        const token = jsonwebtoken_1.default.sign(payload, process.env.ACCESS_SECRET_KEY, {
            expiresIn: "1h",
        });
        const refreshtoken = jsonwebtoken_1.default.sign(payload, process.env.REFRESH_SECRET_KEY, {
            expiresIn: "7d",
        });
        const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
        res.cookie("accesstoken", token, {
            httpOnly: true,
            secure: isSecure,
            sameSite: "lax",
            maxAge: 60 * 60 * 1000,
        });
        res.cookie("refreshtoken", refreshtoken, {
            httpOnly: true,
            secure: isSecure,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({ message: "Muvaffaqiyatli kirildi", status: "success" });
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return next(base_error_1.BaseError.BadRequest(404, "Token xato"));
        }
        next(error);
    }
}
async function getTeacherPayments(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const teacherId = req.params.id;
        const teacher = await teacher_model_1.default.findOne({
            where: (0, branch_scope_helper_1.withBranchScope)(req, { id: teacherId }),
            attributes: ["id"],
        });
        if (!teacher)
            return next(base_error_1.BaseError.BadRequest(403, "Sizga ruxsat yo'q"));
        const payments = await teacher_payment_model_1.default.findAll({
            where: { teacher_id: teacherId },
            order: [["given_date", "DESC"]],
        });
        res.status(200).json(payments);
    }
    catch (error) {
        next(error);
    }
}
async function getTeacherSalaries(req, res, next) {
    try {
        const { month, year } = req.query;
        // Agar month va year berilgan bo‘lsa, faqat shu oylikni filtrlaymiz
        const whereCondition = {};
        if (month && year) {
            whereCondition.given_date = {
                [sequelize_1.Op.and]: [
                    sequelize_1.Sequelize.where((0, sequelize_1.fn)('DATE_PART', 'month', (0, sequelize_1.col)('given_date')), parseInt(month)),
                    sequelize_1.Sequelize.where((0, sequelize_1.fn)('DATE_PART', 'year', (0, sequelize_1.col)('given_date')), parseInt(year)),
                ],
            };
        }
        const salaries = await teacher_payment_model_1.default.findAll({
            attributes: [
                'id',
                'teacher_id',
                'payment_type',
                'given_by',
                'payment_amount',
                'given_date',
                [(0, sequelize_1.literal)(`"teacher"."first_name" || ' ' || "teacher"."last_name"`), 'teacher_name'],
            ],
            include: [{
                    model: teacher_model_1.default,
                    as: 'teacher',
                    attributes: [],
                    required: true,
                    where: (0, branch_scope_helper_1.withBranchScope)(req),
                }],
            where: whereCondition,
            order: [['given_date', 'DESC']],
            raw: true,
            nest: true,
        });
        // Oylik bo‘yicha guruhlash (agar kerak bo‘lsa)
        const monthlySummary = salaries.reduce((acc, sal) => {
            const date = new Date(sal.given_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!acc[monthKey]) {
                acc[monthKey] = { total: 0, payments: [] };
            }
            acc[monthKey].total += Number(sal.payment_amount);
            acc[monthKey].payments.push(sal);
            return acc;
        }, {});
        res.status(200).json({
            all_salaries: salaries,
            monthly_summary: Object.entries(monthlySummary).map(([month, info]) => ({
                month,
                total: info.total,
                count: info.payments.length,
                payments: info.payments,
            })),
        });
    }
    catch (error) {
        console.error("getTeacherSalaries xatosi:", error);
        next(error);
    }
}
async function createPayment(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const { teacher_id, payment_type, given_by, payment_amount, given_date } = req.body;
        const teacher = await teacher_model_1.default.findByPk(teacher_id);
        if (!teacher) {
            return next(base_error_1.BaseError.BadRequest(404, "Ustoz topilmadi"));
        }
        const teacherBalance = await teacher_balance_model_1.default.findOne({
            where: { teacher_id },
        });
        if (!teacherBalance ||
            teacherBalance.dataValues.balance < Number(payment_amount)) {
            return next(base_error_1.BaseError.BadRequest(400, "Ustoz hisobidagi summa kiritilgan summaga yetmaydi!"));
        }
        const payment = await teacher_payment_model_1.default.create({
            teacher_id,
            payment_type,
            given_by,
            payment_amount,
            given_date,
        });
        await teacherBalance.update({
            balance: Math.round(teacherBalance.dataValues.balance - Number(payment_amount)),
        });
        res.status(200).json(payment);
    }
    catch (error) {
        next(error);
    }
}
async function getTeacherBalance(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const teacherId = req.params.id;
        const teacherBalance = await teacher_balance_model_1.default.findOne({
            where: { teacher_id: teacherId },
        });
        if (!teacherBalance) {
            await teacher_balance_model_1.default.create({ teacher_id: teacherId, balance: 0 });
            return res.status(200).json({ balance: 0 });
        }
        res.status(200).json(teacherBalance);
    }
    catch (error) {
        next(error);
    }
}
async function updateTeacherBalance(teacherId, paymentAmount, shouldAdd, t) {
    const teacherBalance = await teacher_balance_model_1.default.findOne({
        where: { teacher_id: teacherId },
        transaction: t,
    });
    const balance = teacherBalance?.dataValues.balance;
    if (teacherBalance) {
        if (shouldAdd) {
            await teacherBalance.update({ balance: Math.round(balance + Number(paymentAmount) / 2) }, { transaction: t });
        }
        else {
            await teacherBalance.update({ balance: Math.round(balance - Number(paymentAmount) / 2) }, { transaction: t });
        }
    }
    else {
        await teacher_balance_model_1.default.create({ teacher_id: teacherId, balance: Number(paymentAmount) / 2 }, { transaction: t });
    }
}
async function getTeacherDashboardStudentPayments(req, res, next) {
    try {
        const token = req.cookies.accesstoken;
        if (!token) {
            return next(base_error_1.BaseError.BadRequest(404, "Token topilmadi"));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_SECRET_KEY);
            const teacherId = decoded.id;
            const { month: monthParam, year: yearParam } = req.query;
            let month = typeof monthParam === 'string' ? parseInt(monthParam, 10) : 0;
            let year = typeof yearParam === 'string' ? parseInt(yearParam, 10) : new Date().getFullYear();
            const teacherGroups = await Models_1.Group.findAll({
                where: { teacher_id: teacherId },
                attributes: ["id"],
            });
            const groupIds = teacherGroups.map((group) => group.dataValues.id);
            const payments = await Models_1.Student.findAll({
                include: [
                    {
                        model: Models_1.Group,
                        as: "groups",
                        through: { attributes: [] },
                        where: { id: groupIds },
                        attributes: ["id", "group_subject", "monthly_fee"],
                    },
                    {
                        model: Models_1.Payment,
                        as: "studentPayments",
                        required: false,
                        where: {
                            for_which_month: payments_ctr_1.monthsInUzbek[month],
                            [sequelize_1.Op.and]: [
                                (0, sequelize_1.where)((0, sequelize_1.fn)("DATE_PART", (0, sequelize_1.literal)("'year'"), (0, sequelize_1.col)("studentPayments.created_at")), year),
                            ],
                        },
                    },
                ],
                attributes: [
                    "id",
                    "first_name",
                    "last_name",
                    "phone_number",
                    "parents_phone_number",
                ],
            });
            res.json(payments);
        }
        catch (error) {
            console.error("Error fetching teacher payments:", error);
            res.status(500).json({ error: "Server error" });
        }
    }
    catch (error) {
        next(error);
    }
}
async function teacherLogout(req, res, next) {
    try {
        const token = req.cookies.accesstoken;
        if (!token) {
            return next(base_error_1.BaseError.BadRequest(404, "Token topilmadi"));
        }
        try {
            jsonwebtoken_1.default.verify(token, process.env.ACCESS_SECRET_KEY);
        }
        catch (error) {
            return next(base_error_1.BaseError.BadRequest(401, "Token xato"));
        }
        const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
        res.clearCookie("accesstoken", {
            httpOnly: true,
            secure: isSecure,
            sameSite: "lax",
            path: "/",
        });
        res.clearCookie("refreshtoken", {
            httpOnly: true,
            secure: isSecure,
            sameSite: "lax",
            path: "/",
        });
        res.status(200).json({ message: "Tizimdan chiqdingiz!" });
    }
    catch (error) {
        next(error);
    }
}
