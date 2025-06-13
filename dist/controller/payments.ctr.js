"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayments = getPayments;
exports.getOnePayment = getOnePayment;
exports.createPayment = createPayment;
exports.updatePayment = updatePayment;
exports.deletePayment = deletePayment;
const payment_model_1 = __importDefault(require("../Models/payment_model"));
const base_error_1 = require("../Utils/base_error");
const notification_srv_1 = require("../Utils/notification.srv");
const student_model_1 = __importDefault(require("../Models/student_model"));
const lang_1 = __importDefault(require("../Utils/lang"));
function getPayments(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const payments = yield payment_model_1.default.findAll();
            if (payments.length === 0) {
                return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("payment_notFound")));
            }
            res.status(200).json(payments);
        }
        catch (error) {
            next(error);
        }
    });
}
function getOnePayment(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const payment = yield payment_model_1.default.findByPk(req.params.id);
            if (!payment) {
                return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("payments_notFound")));
            }
            res.status(200).json(payment);
        }
        catch (error) {
            next(error);
        }
    });
}
function createPayment(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { pupil_id, payment_amount } = req.body;
            const payment = yield payment_model_1.default.create({ pupil_id, payment_amount });
            const date = new Date();
            const formattedDate = date.toLocaleDateString("uz-UZ", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
            const student = yield student_model_1.default.findByPk(payment.dataValues.pupil_id);
            if (student) {
                yield student.update({ paid_for_this_month: true });
                yield (0, notification_srv_1.createNotification)(student.dataValues.id, req.t("payment_notification", {
                    name: student.dataValues.first_name || "Talaba",
                    date: formattedDate,
                    interpolation: { escapeValue: false },
                }));
            }
            res.status(201).json(payment);
        }
        catch (error) {
            next(error);
        }
    });
}
function updatePayment(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { pupil_id, payment_amount } = req.body;
            const payment = yield payment_model_1.default.findByPk(req.params.id);
            if (!payment) {
                return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("payment_notFound")));
            }
            yield payment.update({ pupil_id, payment_amount });
            res.status(200).json(payment);
        }
        catch (error) {
            next(error);
        }
    });
}
function deletePayment(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const payment = yield payment_model_1.default.findByPk(req.params.id);
            if (!payment) {
                return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("payment_notFound")));
            }
            yield payment.destroy();
            res.status(200).json({ message: lang_1.default.t("payment_deleted") });
        }
        catch (error) {
            next(error);
        }
    });
}
