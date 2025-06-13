"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.latestPayments = latestPayments;
exports.getThisMonthTotalPayments = getThisMonthTotalPayments;
exports.getPayments = getPayments;
exports.getOnePayment = getOnePayment;
exports.createPayment = createPayment;
exports.updatePayment = updatePayment;
exports.deletePayment = deletePayment;
const index_1 = require("../Models/index");
const base_error_1 = require("../Utils/base_error");
const index_2 = require("../Models/index");
const lang_1 = __importDefault(require("../Utils/lang"));
async function getPayments(req, res, next) {
    try {
        const payments = await index_1.Payment.findAll({ include: [{
                    model: index_2.Student,
                    as: "student",
                    attributes: ["first_name", "last_name", "phone_number"],
                    order: [["created_at", "DESC"]],
                }] });
        if (payments.length === 0) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("payment_notFound")));
        }
        res.status(200).json(payments);
    }
    catch (error) {
        next(error);
    }
}
async function getOnePayment(req, res, next) {
    try {
        const payment = await index_1.Payment.findByPk(req.params.id);
        if (!payment) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("payments_notFound")));
        }
        res.status(200).json(payment);
    }
    catch (error) {
        next(error);
    }
}
async function createPayment(req, res, next) {
    try {
        const { pupil_id, payment_amount, payment_type, received, for_which_month } = req.body;
        const payment = await index_1.Payment.create({ pupil_id, payment_amount, payment_type, received, for_which_month });
        const date = new Date();
        const formattedDate = date.toLocaleDateString("uz-UZ", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
        function getMonthsInWord() {
            let thisMonth = new Date().getMonth() + 1;
            let months = {
                1: "yanvar",
                2: "fevral",
                3: "mart",
                4: "aprel",
                5: "may",
                6: "iyun",
                7: "iyul",
                8: "avgust",
                9: "sentabr",
                10: "oktabr",
                11: "noyabr",
                12: "dekabr",
            };
            for (const key in months) {
                if (key == thisMonth) {
                    thisMonth = months[key].toUpperCase();
                    return thisMonth;
                }
            }
        }
        const student = await index_2.Student.findByPk(payment.dataValues.pupil_id);
        if (student) {
            if (getMonthsInWord().toLowerCase() === for_which_month.toLowerCase()) {
                await student.update({ paid_for_this_month: true });
                // await createNotification(
                //   student.dataValues.id,
                //   req.t("payment_notification", {
                //     name: student.dataValues.first_name || "Talaba",
                //     date: formattedDate,
                //     interpolation: { escapeValue: false },
                //   })
                // );
            }
        }
        else {
            return res.status(404).json({
                message: "O'quvchi topilmadi!"
            });
        }
        res.status(201).json(payment);
    }
    catch (error) {
        next(error);
    }
}
async function updatePayment(req, res, next) {
    try {
        const { payment_amount, payment_type, received, for_which_month } = req.body;
        const payment = await index_1.Payment.findByPk(req.params.id);
        if (!payment) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("payment_notFound")));
        }
        payment.update({ payment_amount, payment_type, received, for_which_month });
        await payment.save();
        const updatedPayment = await index_1.Payment.findByPk(req.params.id);
        res.status(200).json(updatedPayment);
    }
    catch (error) {
        next(error);
    }
}
async function deletePayment(req, res, next) {
    try {
        const payment = await index_1.Payment.findByPk(req.params.id);
        if (!payment) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("payment_notFound")));
        }
        await payment.destroy();
        res.status(200).json({ message: lang_1.default.t("payment_deleted") });
    }
    catch (error) {
        next(error);
    }
}
async function latestPayments() {
    const payments = await index_1.Payment.findAll({
        order: [["created_at", "DESC"]],
        limit: 10,
        include: [
            {
                model: index_2.Student,
                as: "student", // aliasni shu bilan mos yozish kerak!
                attributes: ["id", "first_name", "last_name"],
            },
        ],
    });
    return payments;
}
async function getThisMonthTotalPayments() {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const { Sequelize } = require("sequelize");
        const total = await index_1.Payment.sum("payment_amount", {
            where: {
                created_at: {
                    [Sequelize.Op.between]: [startOfMonth, endOfMonth],
                },
            },
        });
        return total ? total : 0;
    }
    catch (error) {
        throw new Error(error);
    }
}
