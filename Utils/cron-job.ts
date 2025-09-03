import schedule from 'node-cron';
import { Sequelize, Op } from 'sequelize';
import { sendSMS } from '../Utils/sms-service';
import { Student, Payment } from '../Models/index';
import cron from "node-cron";
import { resetPaymentsForNewMonth } from "../Utils/reset-payment";

const task = schedule.schedule(
  '47 17 * * *',
  async () => {
    try {
      const now = new Date();
      const currentMonth = now.toLocaleString('default', { month: 'long' });
      const overdueStudents = await Student.findAll({
        include: [
          {
            model: Payment,
            required: false,
            where: {
              for_which_month: currentMonth,
              id: { [Op.is]: null },
            },
          },
        ],
      });

      for (const student of overdueStudents) {
        const message = `Hurmatli ${student.dataValues.first_name} ${student.dataValues.last_name}, to'lov muddati ${now.toLocaleDateString(
          'uz-UZ'
        )} o'tib ketdi. Iltimos, to'lovni amalga oshirishingizni so'raymiz.`;
        console.log(`Scheduled notification to ${student.dataValues.phone_number}: ${message}`);
        const result = await sendSMS(student.dataValues.id, student.dataValues.phone_number, message);
      }
    } catch (error) {
      console.error('Cron jobda xatolik yuz berdi:', error);
    }
  },
  {
    timezone: 'Asia/Tashkent'
  }
);

// cron.schedule("0 0 1 * *", async () => {
//   await resetPaymentsForNewMonth();
// });