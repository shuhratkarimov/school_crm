"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentAlert = paymentAlert;
const index_1 = require("../Models/index");
const base_error_1 = require("../Utils/base_error");
const sms_service_1 = require("../Utils/sms-service");
async function paymentAlert(req, res, next) {
    const { studentId } = req.params;
    const { message } = req.body;
    try {
        const student = await index_1.Student.findByPk(studentId);
        if (!student) {
            return next(base_error_1.BaseError.BadRequest(404, "Student not found!"));
        }
        const { id, first_name, last_name, phone_number } = student.dataValues;
        const defaultMessage = message ? message : `Hurmatli ${first_name} ${last_name}, to'lov muddati o'tib ketdi. Iltimos, ${new Date().toLocaleDateString('uz-UZ')} holatiga to'lovni amalga oshirishingizni so'raymiz.`;
        await (0, sms_service_1.sendSMS)(id, phone_number, defaultMessage);
        res.json({ success: true, message: 'Notification sent' });
    }
    catch (error) {
        console.error('Xatolik:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
}
