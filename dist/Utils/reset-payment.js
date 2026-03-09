"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPaymentsForNewMonth = resetPaymentsForNewMonth;
const index_1 = require("../Models/index");
const database_config_1 = __importDefault(require("../config/database.config"));
async function resetPaymentsForNewMonth() {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthYear = `${currentYear}-${currentMonth.toString().padStart(2, "0")}`;
    const t = await database_config_1.default.transaction();
    try {
        const students = await index_1.Student.findAll({
            include: [{ model: index_1.Group, as: "groups", attributes: ["id"] }],
            transaction: t,
        });
        for (const student of students) {
            const groupIds = student.dataValues.groups.map((group) => group.id);
            for (const groupId of groupIds) {
                const existingRecord = await index_1.StudentGroup.findOne({
                    where: {
                        student_id: student.dataValues.id,
                        group_id: groupId,
                        month: currentMonth,
                        year: currentYear,
                    },
                    transaction: t,
                });
                if (!existingRecord) {
                    await index_1.StudentGroup.create({
                        student_id: student.dataValues.id,
                        group_id: groupId,
                        month: currentMonth,
                        year: currentYear,
                        paid: false,
                    }, { transaction: t });
                }
            }
        }
        await t.commit();
    }
    catch (error) {
        await t.rollback();
        console.error("To'lov holatini yangilashda xato:", error);
        throw error;
    }
}
