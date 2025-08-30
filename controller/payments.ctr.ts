import { NextFunction, Request, Response } from "express";
import { Group, Payment, Student, StudentGroup } from "../Models/index";
import { ICreatePaymentDto } from "../DTO/payment/create_payment_dto";
import { IUpdatePaymentDto } from "../DTO/payment/update_payment_dto";
import { BaseError } from "../Utils/base_error";
import i18next from "../Utils/lang";
import { updateTeacherBalance } from "./teacher.ctr";
import { Op, Sequelize } from "sequelize";
import sequelize from "../config/database.config";

interface IMonthlyPaymentSummary {
  month: string;
  totalAmount: number;
}

export const monthsInUzbek: Record<number, string> = {
  1: "Yanvar",
  2: "Fevral",
  3: "Mart",
  4: "Aprel",
  5: "May",
  6: "Iyun",
  7: "Iyul",
  8: "Avgust",
  9: "Sentyabr",
  10: "Oktabr",
  11: "Noyabr",
  12: "Dekabr",
};

function getMonthsInWord(monthNumber?: number): string {
  const thisMonth: number = monthNumber || new Date().getMonth() + 1;
  return monthsInUzbek[thisMonth] || "Yanvar";
}

async function getPayments(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
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

async function getOnePayment(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
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

async function createPayment(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    let {
      pupil_id,
      payment_amount,
      payment_type,
      received,
      for_which_month,
      for_which_group,
      comment,
    } = req.body as ICreatePaymentDto;

    payment_amount = Number(payment_amount.toFixed(2));
    // Validate input
    if (!pupil_id || !payment_amount || !for_which_group || !for_which_month) {
      return next(BaseError.BadRequest(400, i18next.t("missing_fields")));
    }

    const year = new Date().getFullYear();
    const month = for_which_month

    // Check if student exists
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
      return next(BaseError.BadRequest(404, "O'quvchi topilmadi!"));
    }

    // Check if group exists
    const foundGroup = await Group.findByPk(for_which_group);
    if (!foundGroup) {
      return next(BaseError.BadRequest(404, "Guruh topilmadi!"));
    }

    let studentGroup = await StudentGroup.findOne({
      where: { student_id: pupil_id, group_id: for_which_group, month, year },
    });
    if (!studentGroup) {
      studentGroup = await StudentGroup.create({
        student_id: pupil_id,
        group_id: for_which_group,
        month,
        year,
        paid: false,
      });
    }
    if (payment_amount === Number(foundGroup.dataValues.monthly_fee)) {
      await studentGroup.update({ paid: true });
    }

    const paymentAmount = foundGroup.dataValues.monthly_fee;

    const existingPayment = await Payment.findOne({
      where: {
        pupil_id,
        for_which_group,
        for_which_month,
        payment_amount: paymentAmount,
      },
    })

    if (existingPayment) {
      return next(BaseError.BadRequest(400, "To'lov yozuvi mavjud! To'lovni yangilash uchun to'lovni yangilash qismiga o'ting."));
    }

    // Validate payment amount
    if (payment_amount > paymentAmount) {
      return next(BaseError.BadRequest(400, "Guruh to'lov summasidan katta summa kiritildi!"));
    }

    // Create payment
    const payment = await Payment.create({
      pupil_id,
      payment_amount,
      payment_type,
      received,
      for_which_month: month,
      for_which_group,
      comment,
    });

    // Update payment status in StudentGroup if payment matches monthly fee
    if (payment_amount === Number(paymentAmount)) {
      await StudentGroup.update(
        { paid: true },
        {
          where: {
            student_id: pupil_id,
            group_id: for_which_group,
            month,
            year,
          },
        }
      );

      await student.update({
        paid_groups: student.dataValues.paid_groups + 1,
      });
    }

    // Update teacher balance
    await updateTeacherBalance(foundGroup.dataValues.teacher_id, Math.round(payment_amount).toString(), true);

    res.status(201).json({
      message: "To'lov muvaffaqiyatli qo'shildi!",
      payment,
    });
  } catch (error: any) {
    next(error);
  }
}

async function updatePayment(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const { payment_amount, payment_type, received, for_which_month, comment } = req.body as IUpdatePaymentDto;
    const payment = await Payment.findByPk(req.params.id as string);
    if (!payment) {
      return next(BaseError.BadRequest(404, i18next.t("payment_notFound")));
    }

    const foundGroup = await Group.findByPk(payment.dataValues.for_which_group);
    if (!foundGroup) {
      return next(BaseError.BadRequest(404, "Guruh topilmadi!"));
    }
    let studentGroup = await StudentGroup.findOne({
      where: { student_id: payment.dataValues.pupil_id, group_id: payment.dataValues.for_which_group, month: payment.dataValues.for_which_month, year: payment.dataValues.for_which_year },
    });
    if (!studentGroup) {
      studentGroup = await StudentGroup.create({
        student_id: payment.dataValues.pupil_id,
        group_id: payment.dataValues.for_which_group,
        month: payment.dataValues.for_which_month,
        year: payment.dataValues.for_which_year,
        paid: false,
      });
    }
    if (payment_amount && payment_amount === foundGroup.dataValues.monthly_fee) {
      await studentGroup.update({ paid: true });
    } else if (payment_amount) {
      await studentGroup.update({ paid: false });
    }
    if (payment_amount) {
      if (payment_amount > foundGroup.dataValues.monthly_fee) {
        return next(BaseError.BadRequest(400, "Guruh to'lovidan katta summa kiritildi!"));
      }
      if (payment_amount == foundGroup.dataValues.monthly_fee) {
        await studentGroup.update({ paid: true });
        const foundStudent = await Student.findByPk(payment.dataValues.pupil_id);
        if (!foundStudent) {
          return next(BaseError.BadRequest(404, "O'quvchi topilmadi!"));
        }
        await foundStudent.update({ paid_groups: foundStudent.dataValues.paid_groups + 1 });
      }
      const amountDifference = payment_amount - payment.dataValues.payment_amount;
      await updateTeacherBalance(
        foundGroup.dataValues.teacher_id,
        Math.round(amountDifference).toString(),
        amountDifference > 0
      );
    }

    await payment.update({
      payment_amount,
      payment_type,
      received,
      for_which_month,
      comment,
    });

    const updatedPayment = await Payment.findByPk(req.params.id as string);
    res.status(200).json(updatedPayment);
  } catch (error: any) {
    next(error);
  }
}

const changeMonths = (month: number): string | undefined => {
  return monthsInUzbek[month];
};

async function getOverdueStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const currentMonth = changeMonths(new Date().getMonth() + 1);
    const currentYear = new Date().getFullYear();

    const students = await Student.findAll({
      include: [
        {
          model: Group,
          as: "groups",
          attributes: ["id", "group_subject"],
          through: { attributes: [] },
        },
        {
          model: StudentGroup,
          as: "studentGroups",
          attributes: ["group_id", "paid", "month", "year"],
          where: { month: currentMonth, year: currentYear, paid: false },
          required: true,
        },
      ],
    });

    res.status(200).json(students);
  } catch (error: any) {
    next(error);
  }
}

async function deletePayment(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
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

async function getStudentPayments(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const { studentId } = req.params;
    const year = new Date().getFullYear();

    const payments = await Payment.findAll({
      attributes: [
        [Sequelize.fn("TO_CHAR", Sequelize.col("created_at"), "MM"), "month"],
        [Sequelize.fn("SUM", Sequelize.col("payment_amount")), "jami"],
      ],
      where: {
        pupil_id: studentId,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("DATE_PART", "year", Sequelize.col("created_at")),
            year
          ),
        ],
      },
      group: [Sequelize.fn("TO_CHAR", Sequelize.col("created_at"), "MM")],
      raw: true,
    }) as unknown as IMonthlyPaymentSummary[];

    const paymentsMap = payments.reduce((acc, row) => {
      acc[row.month] = Number(row.totalAmount);
      return acc;
    }, {} as Record<string, number>);

    const result = Array.from({ length: 12 }, (_, i) => {
      const month = String(i + 1).padStart(2, "0");
      return {
        month: `${year}-${month}`,
        monthName: monthsInUzbek[i + 1],
        jami: paymentsMap[month] || 0,
      };
    });

    res.status(200).json(result);
  } catch (err: any) {
    next(err);
  }
}
async function latestPayments() {
  const payments = await Payment.findAll({
    order: [["created_at", "DESC"]],
    limit: 10,
    include: [
      {
        model: Student,
        as: "student",
        attributes: ["id", "first_name", "last_name"],
      },
    ],
  });
  return payments;
}

async function getYearlyPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const year = new Date().getFullYear();

    const payments = await Payment.findAll({
      attributes: [
        [Sequelize.fn("TO_CHAR", Sequelize.col("created_at"), "MM"), "month"],
        [Sequelize.fn("SUM", Sequelize.col("payment_amount")), "totalAmount"],
      ],
      where: Sequelize.where(
        Sequelize.fn("DATE_PART", "year", Sequelize.col("created_at")),
        year
      ),
      group: [Sequelize.fn("TO_CHAR", Sequelize.col("created_at"), "MM")],
      raw: true,
    }) as unknown as IMonthlyPaymentSummary[];

    const paymentsMap = payments.reduce((acc, row) => {
      acc[row.month] = Number(row.totalAmount);
      return acc;
    }, {} as Record<string, number>);

    const monthNames = [
      "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
      "Iyul", "Avgust", "Sentyabr", "Oktabr", "Noyabr", "Dekabr"
    ];

    const result = Array.from({ length: 12 }, (_, i) => {
      const month = String(i + 1).padStart(2, "0");
      return {
        month: `${year}-${month}`,
        monthName: monthNames[i],
        jami: paymentsMap[month] || 0,
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getThisMonthTotalPayments() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const total = await Payment.sum("payment_amount", {
      where: {
        created_at: {
          [Op.between]: [startOfMonth, endOfMonth],
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
  latestPayments,
  getYearlyPayments,
  getStudentPayments,
  getThisMonthTotalPayments,
};