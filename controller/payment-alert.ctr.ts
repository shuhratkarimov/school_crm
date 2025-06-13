import { Student } from '../Models/index';
import {BaseError} from '../Utils/base_error';
import { NextFunction, Request, Response } from 'express';
import { sendSMS } from '../Utils/sms-service';


export async function paymentAlert(req:Request, res:Response, next: NextFunction) {
  const { studentId } = req.params;
  const { message } = req.body;

  try {
    const student = await Student.findByPk(studentId);
    if (!student) {
      return next(BaseError.BadRequest(404, "Student not found!"));
    }
    const { id, first_name, last_name, phone_number } = student.dataValues;
    const defaultMessage = message ? message : `Hurmatli ${first_name} ${last_name}, to'lov muddati o'tib ketdi. Iltimos, ${new Date().toLocaleDateString('uz-UZ')} holatiga to'lovni amalga oshirishingizni so'raymiz.`
    await sendSMS(id, phone_number, defaultMessage)
    res.json({ success: true, message: 'Notification sent' });

  } catch (error) {
    console.error('Xatolik:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
}
