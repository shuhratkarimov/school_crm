import { NextFunction, Request, Response } from "express";
import Payment from "../Models/payment_model";
import { ICreatePaymentDto } from "../DTO/payment/create_payment_dto";
import { BaseError } from "../Utils/base_error";
import { IUpdatePaymentDto } from "../DTO/payment/update_payment_dto";
import { createNotification } from "../Utils/notification.srv";
import Student from "../Models/student_model";
import i18next from "../Utils/lang";

async function getPayments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const payments = await Payment.findAll();
    if (payments.length === 0) {
      return next(BaseError.BadRequest(404, i18next.t("payment_notFound")));
    }
    res.status(200).json(payments);
  } catch (error: any) {
    next(error);
  }
}

async function getOnePayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const payment = await Payment.findByPk(req.params.id as string);
    if (!payment) {
      return next(BaseError.BadRequest(404, i18next.t("payments_notFound")));
    }
    res.status(200).json(payment);
  } catch (error) {
    next(error);
  }
}

async function createPayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const { pupil_id, payment_amount } = req.body as ICreatePaymentDto;

    const payment = await Payment.create({ pupil_id, payment_amount });

    const date = new Date();
    const formattedDate = date.toLocaleDateString("uz-UZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });    

    const student = await Student.findByPk(payment.dataValues.pupil_id);
    if (student) {
      await student.update({ paid_for_this_month: true });

      await createNotification(
        student.dataValues.id,
        req.t("payment_notification", {
          name: student.dataValues.first_name || "Talaba",
          date: formattedDate,
          interpolation: { escapeValue: false },
        })
      );
    }

    res.status(201).json(payment);
  } catch (error: any) {
    next(error);
  }
}

async function updatePayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const { pupil_id, payment_amount } = req.body as IUpdatePaymentDto;
    const payment = await Payment.findByPk(req.params.id as string);

    if (!payment) {
      return next(BaseError.BadRequest(404, i18next.t("payment_notFound")));
    }

    await payment.update({ pupil_id, payment_amount });
    res.status(200).json(payment);
  } catch (error: any) {
    next(error);
  }
}

async function deletePayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const payment = await Payment.findByPk(req.params.id as string);
    if (!payment) {
      return next(BaseError.BadRequest(404, i18next.t("payment_notFound")));
    }

    await payment.destroy();
    res.status(200).json({ message: i18next.t("payment_deleted") });
  } catch (error: any) {
    next(error);
  }
}

export {
  getPayments,
  getOnePayment,
  createPayment,
  updatePayment,
  deletePayment,
};
