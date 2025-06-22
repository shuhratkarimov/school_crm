import { NextFunction, Request, Response } from "express";
import { Group, Payment } from "../Models/index";
import { ICreatePaymentDto } from "../DTO/payment/create_payment_dto";
import { BaseError } from "../Utils/base_error";
import { IUpdatePaymentDto } from "../DTO/payment/update_payment_dto";
import { Student } from "../Models/index";
import i18next from "../Utils/lang";
import StudentGroup from "../Models/student_groups_model";

async function getPayments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const payments = await Payment.findAll({
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["first_name", "last_name", "phone_number"],
          order: [["created_at", "DESC"]],
        },
      ],
    });
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
    const {
      pupil_id,
      payment_amount,
      payment_type,
      received,
      for_which_month,
      for_which_group,
    } = req.body as ICreatePaymentDto;

    const payment = await Payment.create({
      pupil_id,
      payment_amount,
      payment_type,
      received,
      for_which_month,
      for_which_group,
    });

    const student = await Student.findByPk(pupil_id, {
      include: [
        {
          model: Group,
          as: "groups",
          through: { attributes: [] },
        },
      ],
    });

    if (!student) {
      return res.status(404).json({ message: "O'quvchi topilmadi!" });
    }

    const totalGroups = student.dataValues.groups.length;

    const Sequelize = require("sequelize");
    const Op = Sequelize.Op;

    const existingPayments = await Payment.findAll({
      where: {
        pupil_id,
        for_which_month,
      },
    });

    const uniqueGroupIds = new Set(
      existingPayments.map((p) => p.dataValues.for_which_group)
    );
    const paidGroupsCount = uniqueGroupIds.size;

    await student.update({
      paid_groups: paidGroupsCount,
      total_groups: totalGroups,
    });

    function getMonthsInWord() {
      let thisMonth: string | Number = new Date().getMonth() + 1;
      let months: Record<number, string> = {
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
        if (key == thisMonth.toString()) {
          thisMonth = months[key];
          return thisMonth;
        }
      }
    }
    console.log(for_which_month, getMonthsInWord()?.toLowerCase());

    const studentGroup = await StudentGroup.findOne({
      where: { student_id: pupil_id, group_id: for_which_group },
    });
    if (
      studentGroup &&
      for_which_month.toLowerCase() === getMonthsInWord()?.toLowerCase()
    ) {
      await studentGroup.update({ paid: true });
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
    const { payment_amount, payment_type, received, for_which_month } =
      req.body as IUpdatePaymentDto;
    const payment = await Payment.findByPk(req.params.id as string);

    if (!payment) {
      return next(BaseError.BadRequest(404, i18next.t("payment_notFound")));
    }
    payment.update({ payment_amount, payment_type, received, for_which_month });
    await payment.save();
    const updatedPayment = await Payment.findByPk(req.params.id as string);
    res.status(200).json(updatedPayment);
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

export async function latestPayments() {
  const payments = await Payment.findAll({
    order: [["created_at", "DESC"]],
    limit: 10,
    include: [
      {
        model: Student,
        as: "student", // aliasni shu bilan mos yozish kerak!
        attributes: ["id", "first_name", "last_name"],
      },
    ],
  });
  return payments;
}

export async function getThisMonthTotalPayments() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const { Sequelize } = require("sequelize");

    const total = await Payment.sum("payment_amount", {
      where: {
        created_at: {
          [Sequelize.Op.between]: [startOfMonth, endOfMonth],
        },
      },
    });
    return total ? total : 0;
  } catch (error: any) {
    throw new Error(error);
  }
}

export {
  getPayments,
  getOnePayment,
  createPayment,
  updatePayment,
  deletePayment,
};
