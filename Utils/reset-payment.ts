import { Op } from "sequelize";
import { Student, StudentGroup, Group } from "../Models/index";
import sequelize from "../config/database.config";

async function resetPaymentsForNewMonth() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthYear = `${currentYear}-${currentMonth.toString().padStart(2, "0")}`;

  const t = await sequelize.transaction();
  try {
    const students = await Student.findAll({
      include: [{ model: Group, as: "groups", attributes: ["id"] }],
      transaction: t,
    });

    for (const student of students) {
      const groupIds = student.dataValues.groups.map((group: any) => group.id);

      for (const groupId of groupIds) {
        const existingRecord = await StudentGroup.findOne({
          where: {
            student_id: student.dataValues.id,
            group_id: groupId,
            month: currentMonth,
            year: currentYear,
          },
          transaction: t,
        });

        if (!existingRecord) {
          await StudentGroup.create(
            {
              student_id: student.dataValues.id,
              group_id: groupId,
              month: currentMonth,
              year: currentYear,
              paid: false,
            },
            { transaction: t }
          );
        }
      }
    }

    await t.commit();
  } catch (error) {
    await t.rollback();
    console.error("To'lov holatini yangilashda xato:", error);
    throw error;
  }
}

export { resetPaymentsForNewMonth };