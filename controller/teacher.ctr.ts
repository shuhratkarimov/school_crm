import { NextFunction, Request, Response } from "express";
import Teacher from "../Models/teacher_model";
import { ICreateTeacherDto } from "../DTO/teacher/create_teacher_dto";
import { BaseError } from "../Utils/base_error";
import { IUpdateTeacherDto } from "../DTO/teacher/update_teacher_dto";
import i18next, { t } from "i18next";
import { Group, Payment, Student } from "../Models";
import TeacherPayment from "../Models/teacher-payment.model";
import TeacherBalance from "../Models/teacher-balance.model";
import bcryptjs from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken"
import { monthsInUzbek } from "./payments.ctr";
import { col, fn, Op, where, literal, Sequelize } from "sequelize";

async function getTeachers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const teachers = await Teacher.findAll();
    if (teachers.length === 0) {
      return next(
        BaseError.BadRequest(
          404,
          i18next.t("TEACHERS_NOT_FOUND", { lng: lang })
        )
      );
    }
    res.status(200).json(teachers);
  } catch (error: any) {
    next(error);
  }
}

async function getOneTeacher(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const teacher = await Teacher.findByPk(req.params.id as string);
    if (!teacher) {
      return next(
        BaseError.BadRequest(404, i18next.t("TEACHER_NOT_FOUND", { lng: lang }))
      );
    }
    res.status(200).json(teacher);
  } catch (error: any) {
    next(error);
  }
}

async function createTeacher(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const {
      first_name,
      last_name,
      father_name,
      birth_date,
      phone_number,
      subject,
      username,
      password,
    } = req.body as ICreateTeacherDto;
    const teacher = await Teacher.create({
      first_name,
      last_name,
      father_name,
      birth_date,
      phone_number,
      subject,
      username,
      password,
    });
    res.status(200).json(teacher);
  } catch (error: any) {
    next(error);
  }
}

async function updateTeacher(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const {
      first_name,
      last_name,
      father_name,
      birth_date,
      phone_number,
      subject,
      username,
      password,
    } = req.body as IUpdateTeacherDto;
    const teacher = await Teacher.findByPk(req.params.id as string);
    if (!teacher) {
      return next(
        BaseError.BadRequest(404, "Ustoz topilmadi")
      );
    }
    let hashedPassword;
    if (password) {
      hashedPassword = await bcryptjs.hash(password, 12);
    }
    const foundUsername = await Teacher.findOne({
      where: { username },
    });
    if (foundUsername && foundUsername.dataValues.id !== teacher.dataValues.id) {
      return next(
        BaseError.BadRequest(404, "Bunday foydalanuvchi nomi mavjud!\nIltimos boshqa nomni tanlang")
      );
    }
    await teacher.update({
      first_name,
      last_name,
      father_name,
      birth_date,
      phone_number,
      subject,
      username,
      password: hashedPassword,
    });
    res.status(200).json(teacher);
  } catch (error: any) {
    next(error);
  }
}

async function deleteTeacher(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const teacher = await Teacher.findByPk(req.params.id as string);
    if (!teacher) {
      return next(
        BaseError.BadRequest(404, "Ustoz topilmadi")
      );
    }
    await TeacherPayment.destroy({
      where: { teacher_id: teacher.dataValues.id }
    });

    await TeacherBalance.destroy({
      where: { teacher_id: teacher.dataValues.id }
    });

    await teacher.destroy();
    res.status(200).json({
      message: "Ustoz o'chirildi",
    });
  } catch (error: any) {
    next(error);
  }
}

async function getTeacherData(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const token = req.cookies.accesstoken;
    if (!token) {
      return next(
        BaseError.BadRequest(404, "Token topilmadi")
      );
    }
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_SECRET_KEY as string) as JwtPayload;
      const teacherId = decoded.id;
      const teacher = await Teacher.findByPk(teacherId);
      res.status(200).json(teacher);
    } catch (error) {
      next(error);
    }
  } catch (error) {
    next(error);
  }
}

async function getTeacherGroups(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const token = req.cookies.accesstoken;
    if (!token) {
      return next(
        BaseError.BadRequest(404, "Token topilmadi")
      );
    }
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_SECRET_KEY as string) as JwtPayload;
      const teacherId = decoded.id;
      const groups = await Group.findAll({
        where: { teacher_id: teacherId },
        attributes: ["id", "group_subject", "days", "start_time", "end_time"],
      });
      res.status(200).json(groups);
    } catch (error) {
      next(error);
    }
  } catch (error) {
    next(error);
  }
}

async function teacherLogin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const { username, password } = req.body;

    const teacher = await Teacher.findOne({
      where: { username },
    });

    if (!teacher) {
      return next(
        BaseError.BadRequest(404, "Ustoz topilmadi")
      );
    }

    const isPasswordValid = await bcryptjs.compare(password, teacher.dataValues.password);

    if (!isPasswordValid) {
      return next(
        BaseError.BadRequest(404, "Parol xato")
      );
    }

    const payload = {
      id: teacher.dataValues.id,
      username: teacher.dataValues.username,
    }
    const token = jwt.sign(payload, process.env.ACCESS_SECRET_KEY as string, {
      expiresIn: "1h",
    });

    const refreshtoken = jwt.sign(payload, process.env.REFRESH_SECRET_KEY as string, {
      expiresIn: "7d",
    });

    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

    res.cookie("accesstoken", token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    });

    res.cookie("refreshtoken", refreshtoken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "Muvaffaqiyatli kirildi", status: "success" });
  } catch (error: any) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(
        BaseError.BadRequest(404, "Token xato")
      );
    }
    next(error);
  }
}

async function getTeacherPayments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const teacherId = req.params.id;
    const payments = await TeacherPayment.findAll({
      where: { teacher_id: teacherId },
      order: [["given_date", "DESC"]],
    });
    res.status(200).json(payments);
  } catch (error) {
    next(error);
  }
}

async function getTeacherSalaries(req: Request, res: Response, next: NextFunction) {
  try {
    const { month, year } = req.query;

    // Agar month va year berilgan bo‘lsa, faqat shu oylikni filtrlaymiz
    const whereCondition: any = {};
    if (month && year) {
      whereCondition.given_date = {
        [Op.and]: [
          Sequelize.where(
            fn('DATE_PART', 'month', col('given_date')),
            parseInt(month as string)
          ),
          Sequelize.where(
            fn('DATE_PART', 'year', col('given_date')),
            parseInt(year as string)
          ),
        ],
      };
    }

    const salaries = await TeacherPayment.findAll({
      attributes: [
        'id',
        'teacher_id',
        'payment_type',
        'given_by',
        'payment_amount',
        'given_date',
        [literal(`"teacher"."first_name" || ' ' || "teacher"."last_name"`), 'teacher_name'],
      ],
      include: [{
        model: Teacher,
        as: 'teacher',
        attributes: [], // faqat ism-familiya uchun kerak
      }],
      where: whereCondition,
      order: [['given_date', 'DESC']],
      raw: true,
      nest: true,
    });

    // Oylik bo‘yicha guruhlash (agar kerak bo‘lsa)
    const monthlySummary = salaries.reduce((acc: any, sal: any) => {
      const date = new Date(sal.given_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!acc[monthKey]) {
        acc[monthKey] = { total: 0, payments: [] };
      }
      acc[monthKey].total += Number(sal.payment_amount);
      acc[monthKey].payments.push(sal);

      return acc;
    }, {});

    res.status(200).json({
      all_salaries: salaries,
      monthly_summary: Object.entries(monthlySummary).map(([month, info]: [string, any]) => ({
        month,
        total: info.total,
        count: info.payments.length,
        payments: info.payments,
      })),
    });

  } catch (error: any) {
    console.error("getTeacherSalaries xatosi:", error);
    next(error);
  }
}

async function createPayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const { teacher_id, payment_type, given_by, payment_amount, given_date } =
      req.body;

    const teacher = await Teacher.findByPk(teacher_id);

    if (!teacher) {
      return next(
        BaseError.BadRequest(404, "Ustoz topilmadi")
      );
    }

    const teacherBalance = await TeacherBalance.findOne({
      where: { teacher_id },
    });
    if (
      !teacherBalance ||
      teacherBalance.dataValues.balance < Number(payment_amount)
    ) {
      return next(
        BaseError.BadRequest(
          400,
          "Ustoz hisobidagi summa kiritilgan summaga yetmaydi!"
        )
      );
    }

    const payment = await TeacherPayment.create({
      teacher_id,
      payment_type,
      given_by,
      payment_amount,
      given_date,
    });

    await teacherBalance.update({
      balance: Math.round(teacherBalance.dataValues.balance - Number(payment_amount)),
    });

    res.status(200).json(payment);
  } catch (error: any) {
    next(error);
  }
}

async function getTeacherBalance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const teacherId = req.params.id;

    const teacherBalance = await TeacherBalance.findOne({
      where: { teacher_id: teacherId },
    });

    if (!teacherBalance) {
      await TeacherBalance.create({ teacher_id: teacherId, balance: 0 });
      return res.status(200).json({ balance: 0 });
    }

    res.status(200).json(teacherBalance);
  } catch (error: any) {
    next(error);
  }
}

async function updateTeacherBalance(teacherId: string, paymentAmount: string, shouldAdd: boolean, t?: any): Promise<void> {
  const teacherBalance = await TeacherBalance.findOne({
    where: { teacher_id: teacherId },
    transaction: t,
  });
  const balance = teacherBalance?.dataValues.balance;

  if (teacherBalance) {
    if (shouldAdd) {
      await teacherBalance.update({ balance: Math.round(balance + Number(paymentAmount) / 2) }, { transaction: t });
    } else {
      await teacherBalance.update({ balance: Math.round(balance - Number(paymentAmount) / 2) }, { transaction: t });
    }
  } else {
    await TeacherBalance.create({ teacher_id: teacherId, balance: Number(paymentAmount) / 2 }, { transaction: t });
  }
}

async function getTeacherDashboardStudentPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies.accesstoken;
    if (!token) {
      return next(BaseError.BadRequest(404, "Token topilmadi"));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.ACCESS_SECRET_KEY as string
      ) as JwtPayload;

      const teacherId = decoded.id;
      const { month: monthParam, year: yearParam } = req.query;
      let month = typeof monthParam === 'string' ? parseInt(monthParam, 10) : 0;
      let year = typeof yearParam === 'string' ? parseInt(yearParam, 10) : new Date().getFullYear();

      const teacherGroups = await Group.findAll({
        where: { teacher_id: teacherId },
        attributes: ["id"],
      });

      const groupIds = teacherGroups.map((group) => group.dataValues.id);

      const payments = await Student.findAll({
        include: [
          {
            model: Group,
            as: "groups",
            through: { attributes: [] },
            where: { id: groupIds },
            attributes: ["id", "group_subject", "monthly_fee"],
          },
          {
            model: Payment,
            as: "payments",
            where: {
              for_which_month: monthsInUzbek[month],
              [Op.and]: [
                where(
                  fn("DATE_PART", literal("'year'"), col("payments.created_at")),
                  year
                ),
              ],
            },
            required: false,
          },
        ],
        attributes: [
          "id",
          "first_name",
          "last_name",
          "phone_number",
          "parents_phone_number",
        ],
      });

      res.json(payments);
    } catch (error) {
      console.error("Error fetching teacher payments:", error);
      res.status(500).json({ error: "Server error" });
    }
  } catch (error) {
    next(error);
  }
}

async function teacherLogout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies.accesstoken;
    if (!token) {
      return next(BaseError.BadRequest(404, "Token topilmadi"));
    }
    try {
      jwt.verify(token, process.env.ACCESS_SECRET_KEY as string);
    } catch (error) {
      return next(BaseError.BadRequest(401, "Token xato"));
    }
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.clearCookie("accesstoken", {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
    });
    res.clearCookie("refreshtoken", {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
    });
    res.status(200).json({ message: "Tizimdan chiqdingiz!" });
  } catch (error) {
    next(error);
  }
}

export {
  getTeachers,
  getOneTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  teacherLogin,
  getTeacherGroups,
  createPayment,
  getTeacherBalance,
  updateTeacherBalance,
  getTeacherPayments,
  getTeacherData,
  getTeacherDashboardStudentPayments,
  teacherLogout,
  getTeacherSalaries
};
