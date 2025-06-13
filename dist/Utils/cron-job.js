"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const sequelize_1 = require("sequelize");
const sms_service_1 = require("../Utils/sms-service");
const index_1 = require("../Models/index");
const task = node_cron_1.default.schedule('47 17 * * *', // Har kuni soat 17:45 da ishlaydi
async () => {
    try {
        const now = new Date();
        const currentMonth = now.toLocaleString('default', { month: 'long' });
        const overdueStudents = await index_1.Student.findAll({
            include: [
                {
                    model: index_1.Payment,
                    required: false,
                    where: {
                        for_which_month: currentMonth,
                        id: { [sequelize_1.Op.is]: null }, // Faqat to'lov amalga oshirilmagan talabalar
                    },
                },
            ],
        });
        for (const student of overdueStudents) {
            const message = `Hurmatli ${student.dataValues.first_name} ${student.dataValues.last_name}, to'lov muddati ${now.toLocaleDateString('uz-UZ')} o'tib ketdi. Iltimos, to'lovni amalga oshirishingizni so'raymiz.`;
            console.log(`Scheduled notification to ${student.dataValues.phone_number}: ${message}`);
            const result = await (0, sms_service_1.sendSMS)(student.dataValues.id, student.dataValues.phone_number, message);
        }
    }
    catch (error) {
        console.error('Cron jobda xatolik yuz berdi:', error);
    }
}, {
    timezone: 'Asia/Tashkent'
});
