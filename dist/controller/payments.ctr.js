"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.monthsInUzbek = void 0;
exports.getPayments = getPayments;
exports.getOnePayment = getOnePayment;
exports.createPayment = createPayment;
exports.updatePayment = updatePayment;
exports.deletePayment = deletePayment;
exports.latestPayments = latestPayments;
exports.getYearlyPayments = getYearlyPayments;
exports.getStudentPayments = getStudentPayments;
exports.getThisMonthTotalPayments = getThisMonthTotalPayments;
exports.getGroupMonthlyPaymentSummary = getGroupMonthlyPaymentSummary;
exports.getUnpaidPayments = getUnpaidPayments;
exports.getDailyPaymentsThisMonth = getDailyPaymentsThisMonth;
const index_1 = require("../Models/index");
const base_error_1 = require("../Utils/base_error");
const lang_1 = __importDefault(require("../Utils/lang"));
const teacher_ctr_1 = require("./teacher.ctr");
const sequelize_1 = require("sequelize");
const branch_scope_helper_1 = require("../Utils/branch_scope.helper");
const database_config_1 = __importDefault(require("../config/database.config"));
const server_1 = require("../server");
async function getDailyPaymentsThisMonth(req) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const where = (0, branch_scope_helper_1.withBranchScope)(req, {
        created_at: { [sequelize_1.Op.between]: [startOfMonth, endOfMonth] },
    });
    const daily = await index_1.Payment.findAll({
        attributes: [
            [sequelize_1.Sequelize.fn("TO_CHAR", sequelize_1.Sequelize.col("created_at"), "YYYY-MM-DD"), "day"],
            [sequelize_1.Sequelize.fn("SUM", sequelize_1.Sequelize.col("payment_amount")), "totalAmount"],
        ],
        where,
        group: [sequelize_1.Sequelize.fn("TO_CHAR", sequelize_1.Sequelize.col("created_at"), "YYYY-MM-DD")],
        order: [[sequelize_1.Sequelize.fn("TO_CHAR", sequelize_1.Sequelize.col("created_at"), "YYYY-MM-DD"), "ASC"]],
        raw: true,
    });
    const map = daily.reduce((acc, r) => {
        acc[r.day] = Number(r.totalAmount || 0);
        return acc;
    }, {});
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    return Array.from({ length: daysInMonth }, (_, i) => {
        const dd = String(i + 1).padStart(2, "0");
        const key = `${yyyy}-${mm}-${dd}`;
        return { day: key, jami: map[key] || 0 };
    });
}
exports.monthsInUzbek = {
    1: "Yanvar",
    2: "Fevral",
    3: "Mart",
    4: "Aprel",
    5: "May",
    6: "Iyun",
    7: "Iyul",
    8: "Avgust",
    9: "Sentyabr",
    10: "Oktabr",
    11: "Noyabr",
    12: "Dekabr",
};
function getMonthsInWord(monthNumber) {
    const thisMonth = monthNumber || new Date().getMonth() + 1;
    return exports.monthsInUzbek[thisMonth] || "Yanvar";
}
async function getPayments(req, res, next) {
    try {
        const where = (0, branch_scope_helper_1.withBranchScope)(req);
        const payments = await index_1.Payment.findAll({
            where,
            include: [
                {
                    model: index_1.Student,
                    as: "student",
                    attributes: ["first_name", "last_name", "phone_number"],
                },
                {
                    model: index_1.Group,
                    as: "paymentGroup",
                    attributes: ["id", "group_subject"],
                },
            ],
            order: [["created_at", "DESC"]],
        });
        if (payments.length === 0) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("payment_notFound")));
        }
        res.status(200).json(payments);
    }
    catch (e) {
        next(e);
    }
}
async function getOnePayment(req, res, next) {
    try {
        const where = (0, branch_scope_helper_1.withBranchScope)(req, { id: req.params.id });
        const payment = await index_1.Payment.findOne({
            where,
            include: [
                { model: index_1.Student, as: "student", attributes: ["first_name", "last_name", "phone_number"] },
                { model: index_1.Group, as: "paymentGroup", attributes: ["id", "group_subject"] },
            ],
        });
        if (!payment)
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("payments_notFound")));
        res.status(200).json(payment);
    }
    catch (e) {
        next(e);
    }
}
async function getGroupMonthlyPaymentSummary(req, res, next) {
    try {
        const { groupId } = req.params;
        const now = new Date();
        const year = now.getFullYear();
        const monthNum = now.getMonth() + 1;
        const monthName = exports.monthsInUzbek[monthNum] || "Yanvar";
        // Guruhdagi o'quvchilar
        const students = await index_1.Student.findAll({
            attributes: ['id'],
            include: [{
                    model: index_1.StudentGroup,
                    as: "studentGroups",
                    where: { group_id: groupId },
                    required: true,
                    attributes: [],
                }],
            raw: true,
        });
        const studentIds = students.map((s) => s.id);
        let summaryResult = {
            month: monthName,
            year,
            total_paid: 0,
            paid_count: 0,
            total_students: studentIds.length,
            monthly_fee: null,
        };
        if (studentIds.length === 0) {
            return res.json({ success: true, ...summaryResult });
        }
        // Guruh ma'lumotini olish (monthly_fee uchun)
        const group = await index_1.Group.findByPk(groupId, { attributes: ['monthly_fee'], raw: true });
        if (group) {
            summaryResult.monthly_fee = group.monthly_fee;
        }
        // To'lovlar summasi va soni
        const summary = await index_1.Payment.findOne({
            where: {
                group_id: groupId,
                for_which_month: monthName,
                pupil_id: { [sequelize_1.Op.in]: studentIds },
            },
            attributes: [
                [sequelize_1.Sequelize.fn('SUM', sequelize_1.Sequelize.col('payment_amount')), 'total'],
                [sequelize_1.Sequelize.fn('COUNT', sequelize_1.Sequelize.col('id')), 'count'],
            ],
            raw: true,
        });
        summaryResult.total_paid = summary?.total ? Math.round(Number(summary.total)) : 0;
        summaryResult.paid_count = summary?.count ? Number(summary.count) : 0;
        return res.json({ success: true, ...summaryResult });
    }
    catch (err) {
        console.error("getGroupMonthlyPaymentSummary xatosi:", err);
        next(err);
    }
}
async function createPayment(req, res, next) {
    const t = await database_config_1.default.transaction();
    try {
        let { pupil_id, payment_type, received, for_which_month, comment, payments, // [{ group_id, payment_amount, shouldBeConsideredAsPaid }]
         } = req.body;
        if (!pupil_id || !for_which_month || !Array.isArray(payments) || payments.length === 0) {
            await t.rollback();
            return next(base_error_1.BaseError.BadRequest(400, lang_1.default.t("missing_fields")));
        }
        const student = await index_1.Student.findByPk(pupil_id, {
            attributes: ["id", "branch_id", "first_name", "last_name"],
            transaction: t,
        });
        if (!student) {
            await t.rollback();
            return next(base_error_1.BaseError.BadRequest(404, "O'quvchi topilmadi!"));
        }
        const studentBranchId = student.branch_id;
        if (!studentBranchId) {
            await t.rollback();
            return next(base_error_1.BaseError.BadRequest(400, "Student branch_id yo'q"));
        }
        if (!req.scope?.all && !req.scope.branchIds.includes(studentBranchId)) {
            await t.rollback();
            return next(base_error_1.BaseError.BadRequest(403, "Sizga ruxsat yo'q"));
        }
        const month = for_which_month;
        const year = new Date().getFullYear();
        const createdPayments = [];
        const paidGroupNames = [];
        let totalPaidAmount = 0;
        for (const item of payments) {
            const groupId = item?.group_id;
            const paymentAmount = Number(item?.payment_amount);
            const shouldBeConsideredAsPaid = item?.shouldBeConsideredAsPaid === true;
            if (!groupId || !paymentAmount) {
                await t.rollback();
                return next(base_error_1.BaseError.BadRequest(400, "Guruh yoki to'lov summasi noto'g'ri"));
            }
            const foundGroup = await index_1.Group.findByPk(groupId, { transaction: t });
            if (!foundGroup) {
                await t.rollback();
                return next(base_error_1.BaseError.BadRequest(404, `Guruh topilmadi: ${groupId}`));
            }
            const existingPayment = await index_1.Payment.findOne({
                where: {
                    pupil_id,
                    group_id: groupId,
                    for_which_month: month,
                    branch_id: studentBranchId,
                },
                transaction: t,
            });
            if (existingPayment) {
                await t.rollback();
                return next(base_error_1.BaseError.BadRequest(400, `${foundGroup.group_subject || "Guruh"} uchun to'lov yozuvi mavjud!`));
            }
            const monthlyFee = Number(foundGroup.monthly_fee ?? 0);
            if (monthlyFee < paymentAmount) {
                await t.rollback();
                return next(base_error_1.BaseError.BadRequest(400, `${foundGroup.group_subject || "Guruh"} uchun to'lov summasi oylik summadan katta!`));
            }
            const payment = await index_1.Payment.create({
                pupil_id,
                payment_amount: paymentAmount,
                payment_type,
                received,
                for_which_month: month,
                group_id: groupId,
                comment,
                shouldBeConsideredAsPaid,
                branch_id: studentBranchId,
            }, { transaction: t });
            if (paymentAmount === monthlyFee || shouldBeConsideredAsPaid) {
                await index_1.StudentGroup.update({ paid: true }, {
                    where: {
                        student_id: pupil_id,
                        group_id: groupId,
                        month,
                        year,
                    },
                    transaction: t,
                });
            }
            await (0, teacher_ctr_1.updateTeacherBalance)(foundGroup.teacher_id, Math.round(paymentAmount).toString(), true, t);
            createdPayments.push(payment);
            paidGroupNames.push(foundGroup.group_subject ?? "Noma'lum guruh");
            totalPaidAmount += paymentAmount;
        }
        const studentName = [
            student.first_name,
            student.last_name,
        ]
            .filter(Boolean)
            .join(" ")
            .trim();
        const targetUsers = await index_1.User.findAll({
            where: { role: "director" },
            attributes: ["id"],
            transaction: t,
        });
        const targetUserIds = targetUsers.map((u) => u.id);
        const settings = await index_1.UserSettings.findAll({
            where: {
                user_id: targetUserIds,
                payment_alerts: true,
            },
            attributes: ["user_id"],
            transaction: t,
        });
        const enabledUserIds = new Set(settings.map((s) => s.user_id));
        const filteredUsers = targetUsers.filter((u) => enabledUserIds.has(u.id));
        const groupNamesText = paidGroupNames.length <= 2
            ? paidGroupNames.join(", ")
            : `${paidGroupNames.slice(0, 2).join(", ")} va yana ${paidGroupNames.length - 2} ta guruh`;
        const notificationsPayload = filteredUsers.map((user) => ({
            user_id: user.id,
            title: "Yangi to'lov qabul qilindi",
            message: `${studentName || "O'quvchi"} uchun ${groupNamesText} bo'yicha jami ${totalPaidAmount} so'm to'lov qo'shildi`,
            type: "success",
            is_read: false,
            meta: {
                payment_ids: createdPayments.map((p) => p.id),
                pupil_id,
                group_ids: payments.map((p) => p.group_id),
                branch_id: studentBranchId,
                total_amount: totalPaidAmount,
                month,
            },
        }));
        const createdNotifications = notificationsPayload.length > 0
            ? await index_1.UserNotification.bulkCreate(notificationsPayload, {
                transaction: t,
                returning: true,
            })
            : [];
        await t.commit();
        if (server_1.io) {
            for (const notification of createdNotifications) {
                const roomName = `user:${notification.user_id}`;
                server_1.io.to(roomName).emit("new-notification", {
                    id: notification.id,
                    title: notification.title,
                    message: notification.message,
                    type: notification.type,
                    color: notification.type === "success"
                        ? "green"
                        : notification.type === "warning"
                            ? "yellow"
                            : notification.type === "danger"
                                ? "red"
                                : "blue",
                    isRead: Boolean(notification.is_read),
                    createdAt: notification.created_at,
                    timeAgo: "Hozirgina",
                    meta: notification.meta ?? null,
                });
            }
        }
        return res.status(201).json({
            message: "To'lovlar muvaffaqiyatli qo'shildi!",
            payments: createdPayments,
            totalPaidAmount,
        });
    }
    catch (error) {
        await t.rollback();
        next(error);
    }
}
async function updatePayment(req, res, next) {
    try {
        const { payment_amount, payment_type, received, for_which_month, comment, shouldBeConsideredAsPaid } = req.body;
        const where = (0, branch_scope_helper_1.withBranchScope)(req, { id: req.params.id });
        const payment = await index_1.Payment.findOne({ where });
        if (!payment) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("payment_notFound")));
        }
        delete req.body.branch_id;
        const foundGroup = await index_1.Group.findByPk(payment.dataValues.group_id);
        if (!foundGroup) {
            return next(base_error_1.BaseError.BadRequest(404, "Guruh topilmadi!"));
        }
        let studentGroup = await index_1.StudentGroup.findOne({
            where: { student_id: payment.dataValues.pupil_id, group_id: payment.dataValues.group_id, month: payment.dataValues.for_which_month },
        });
        if (!studentGroup) {
            studentGroup = await index_1.StudentGroup.create({
                student_id: payment.dataValues.pupil_id,
                group_id: payment.dataValues.group_id,
                month: payment.dataValues.for_which_month,
                year: payment.dataValues.year,
                paid: false,
                shouldBeConsideredAsPaid: shouldBeConsideredAsPaid || false,
            });
        }
        if (for_which_month) {
            const foundPayment = await index_1.Payment.findOne({
                where: {
                    pupil_id: payment.dataValues.pupil_id,
                    group_id: payment.dataValues.group_id,
                    for_which_month
                },
            });
            if (foundPayment && foundPayment.dataValues.id !== payment.dataValues.id) {
                return next(base_error_1.BaseError.BadRequest(400, "To'lov mavjud! To'lovni yangilash uchun to'lovni yangilash qismiga o'ting."));
            }
        }
        if (payment_amount && payment_amount === foundGroup.dataValues.monthly_fee) {
            await studentGroup.update({ paid: true });
        }
        else if (payment_amount) {
            await studentGroup.update({ paid: false });
        }
        if (shouldBeConsideredAsPaid) {
            await studentGroup.update({ paid: shouldBeConsideredAsPaid });
        }
        if (payment_amount) {
            if (payment_amount > foundGroup.dataValues.monthly_fee) {
                return next(base_error_1.BaseError.BadRequest(400, "Guruh to'lovidan katta summa kiritildi!"));
            }
            if (payment_amount == foundGroup.dataValues.monthly_fee) {
                await studentGroup.update({ paid: true });
                const foundStudent = await index_1.Student.findByPk(payment.dataValues.pupil_id);
                if (!foundStudent) {
                    return next(base_error_1.BaseError.BadRequest(404, "O'quvchi topilmadi!"));
                }
                await foundStudent.update({ paid_groups: foundStudent.dataValues.paid_groups + 1 });
            }
            const amountDifference = payment_amount - payment.dataValues.payment_amount;
            await (0, teacher_ctr_1.updateTeacherBalance)(foundGroup.dataValues.teacher_id, Math.round(amountDifference).toString(), amountDifference > 0);
        }
        await payment.update({
            payment_amount,
            payment_type,
            received,
            for_which_month,
            comment,
            shouldBeConsideredAsPaid,
        });
        const updatedPayment = await index_1.Payment.findByPk(req.params.id);
        res.status(200).json(updatedPayment);
    }
    catch (error) {
        next(error);
    }
}
const changeMonths = (month) => {
    return exports.monthsInUzbek[month];
};
async function getOverdueStudents(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const currentMonth = changeMonths(new Date().getMonth() + 1);
        const currentYear = new Date().getFullYear();
        const students = await index_1.Student.findAll({
            include: [
                {
                    model: index_1.Group,
                    as: "groups",
                    attributes: ["id", "group_subject"],
                    through: { attributes: [] },
                },
                {
                    model: index_1.StudentGroup,
                    as: "studentGroups",
                    attributes: ["group_id", "paid", "month", "year"],
                    where: { month: currentMonth, year: currentYear, paid: false },
                    required: true,
                },
            ],
        });
        res.status(200).json(students);
    }
    catch (error) {
        next(error);
    }
}
async function deletePayment(req, res, next) {
    try {
        const where = (0, branch_scope_helper_1.withBranchScope)(req, { id: req.params.id });
        const payment = await index_1.Payment.findOne({ where });
        if (!payment)
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("payment_notFound")));
        const foundGroup = await index_1.StudentGroup.findOne({
            where: {
                student_id: payment.dataValues.pupil_id,
                group_id: payment.dataValues.group_id,
                month: payment.dataValues.for_which_month,
                year: new Date().getFullYear(),
            },
        });
        if (!foundGroup) {
            return next(base_error_1.BaseError.BadRequest(404, "Guruh topilmadi!"));
        }
        if (foundGroup.dataValues.paid) {
            await foundGroup.update({ paid: false });
        }
        const groupTeacher = await index_1.Group.findByPk(foundGroup.dataValues.group_id);
        if (!groupTeacher) {
            return next(base_error_1.BaseError.BadRequest(404, "Guruh topilmadi!"));
        }
        await (0, teacher_ctr_1.updateTeacherBalance)(groupTeacher.dataValues.teacher_id, Math.round(payment.dataValues.payment_amount).toString(), false);
        await payment.destroy();
        res.status(200).json({ message: lang_1.default.t("payment_deleted") });
    }
    catch (error) {
        next(error);
    }
}
async function getStudentPayments(req, res, next) {
    try {
        const { studentId } = req.params;
        const year = new Date().getFullYear();
        const payments = await index_1.Payment.findAll({
            attributes: [
                [sequelize_1.Sequelize.fn("TO_CHAR", sequelize_1.Sequelize.col("created_at"), "MM"), "month"],
                [sequelize_1.Sequelize.fn("SUM", sequelize_1.Sequelize.col("payment_amount")), "jami"],
            ],
            where: {
                pupil_id: studentId,
                [sequelize_1.Op.and]: [
                    sequelize_1.Sequelize.where(sequelize_1.Sequelize.fn("DATE_PART", "year", sequelize_1.Sequelize.col("created_at")), year),
                ],
            },
            group: [sequelize_1.Sequelize.fn("TO_CHAR", sequelize_1.Sequelize.col("created_at"), "MM")],
            raw: true,
        });
        const paymentsMap = payments.reduce((acc, row) => {
            acc[row.month] = Number(row.totalAmount);
            return acc;
        }, {});
        const result = Array.from({ length: 12 }, (_, i) => {
            const month = String(i + 1).padStart(2, "0");
            return {
                month: `${year}-${month}`,
                monthName: exports.monthsInUzbek[i + 1],
                jami: paymentsMap[month] || 0,
            };
        });
        res.status(200).json(result);
    }
    catch (err) {
        next(err);
    }
}
async function latestPayments(req) {
    const payments = await index_1.Payment.findAll({
        where: (0, branch_scope_helper_1.withBranchScope)(req),
        order: [["created_at", "DESC"]],
        limit: 10,
        include: [
            {
                model: index_1.Student,
                as: "student",
                attributes: ["id", "first_name", "last_name"],
            },
        ],
    });
    return payments;
}
async function getYearlyPayments(req, res, next) {
    try {
        const year = new Date().getFullYear();
        const branchWhere = (0, branch_scope_helper_1.withBranchScope)(req);
        const where = {
            ...branchWhere,
            [sequelize_1.Op.and]: [
                sequelize_1.Sequelize.where(sequelize_1.Sequelize.fn("DATE_PART", "year", sequelize_1.Sequelize.col("created_at")), year),
            ],
        };
        const monthlyRows = await index_1.Payment.findAll({
            attributes: [
                [sequelize_1.Sequelize.fn("TO_CHAR", sequelize_1.Sequelize.col("created_at"), "MM"), "month"],
                [sequelize_1.Sequelize.fn("SUM", sequelize_1.Sequelize.col("payment_amount")), "totalAmount"],
            ],
            where,
            group: [sequelize_1.Sequelize.fn("TO_CHAR", sequelize_1.Sequelize.col("created_at"), "MM")],
            raw: true,
        });
        const paymentsMap = monthlyRows.reduce((acc, row) => {
            acc[row.month] = Number(row.totalAmount || 0);
            return acc;
        }, {});
        const monthNames = [
            "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
            "Iyul", "Avgust", "Sentyabr", "Oktabr", "Noyabr", "Dekabr"
        ];
        const monthly = Array.from({ length: 12 }, (_, i) => {
            const month = String(i + 1).padStart(2, "0");
            return {
                month: `${year}-${month}`,
                monthName: monthNames[i],
                jami: paymentsMap[month] || 0,
            };
        });
        const dailyThisMonth = await getDailyPaymentsThisMonth(req);
        return res.json({
            success: true,
            year,
            monthly,
            dailyThisMonth,
        });
    }
    catch (err) {
        next(err);
    }
}
async function getThisMonthTotalPayments(req) {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const total = await index_1.Payment.sum("payment_amount", {
            where: (0, branch_scope_helper_1.withBranchScope)(req, {
                created_at: {
                    [sequelize_1.Op.between]: [startOfMonth, endOfMonth],
                },
            }),
        });
        return total ? total : 0;
    }
    catch (error) {
        throw new Error(error);
    }
}
async function getUnpaidPayments(req, res, next) {
    try {
        const { year, month, studentId, groupId } = req.query;
        // Parametrlarni tayyorlash
        const filterYear = year ? parseInt(year, 10) : new Date().getFullYear();
        let filterMonths = [];
        if (month && month !== "all") {
            // faqat bitta oy tanlangan
            filterMonths = [month];
        }
        else {
            // barcha oylar (joriy yil uchun yoki tanlangan yil uchun)
            filterMonths = Object.values(exports.monthsInUzbek);
        }
        // where shartlari
        const whereClause = {
            year: filterYear,
            month: { [sequelize_1.Op.in]: filterMonths },
            paid: false,
        };
        if (studentId) {
            whereClause.student_id = studentId;
        }
        if (groupId) {
            whereClause.group_id = groupId;
        }
        const unpaidRecords = await index_1.StudentGroup.findAll({
            where: whereClause,
            include: [
                {
                    model: index_1.Student,
                    as: "student",
                    where: (0, branch_scope_helper_1.withBranchScope)(req),
                    attributes: ["id", "first_name", "last_name", "phone_number"],
                },
                {
                    model: index_1.Group,
                    as: "studentGroupParent",
                    where: (0, branch_scope_helper_1.withBranchScope)(req),
                    attributes: ["id", "group_subject", "monthly_fee"],
                },
            ],
            order: [
                ["student", "last_name", "ASC"],
                ["month", "ASC"],
            ],
            raw: false,
        });
        // Natijani formatlash
        const result = unpaidRecords.map((record) => ({
            student: {
                id: record.student?.id,
                fullName: `${record.student?.first_name || ""} ${record.student?.last_name || ""}`.trim() || "Noma'lum",
                phone: record.student?.phone_number || "-",
            },
            group: {
                id: record.studentGroupParent?.id,
                name: record.studentGroupParent?.group_subject || "—",
                monthlyFee: record.studentGroupParent?.monthly_fee || 0,
            },
            month: record.month,
            year: record.year,
            status: "to'lanmagan",
        }));
        res.status(200).json({
            success: true,
            count: result.length,
            year: filterYear,
            month: month || "all",
            data: result,
        });
    }
    catch (err) {
        console.error("getUnpaidPayments xatosi:", err);
        next(err); // agar global error handler bo'lsa
    }
}
