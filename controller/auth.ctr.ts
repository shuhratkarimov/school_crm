import { Request, Response, NextFunction } from "express";
import User from "../Models/user_model";
import { BaseError } from "../Utils/base_error";
import bcryptjs from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import sendVerificationEmail from "../Utils/email_verifier";
import i18next from "../Utils/lang";
import { ICreateUserDto } from "../DTO/user/create_user_dto";
import { IVerifyEmailDto } from "../DTO/user/verify_user_dto";
import { ILoginDto } from "../DTO/user/login_user_dto";
import { Teacher } from "../Models";

dotenv.config();

User.sync({ force: false });

async function checkAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.accesstoken;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    jwt.verify(token, process.env.ACCESS_SECRET_KEY as string);
    res.status(200).json({ message: "Authenticated" });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
}

async function checkTeacherAuth(req: Request, res: Response) {
  try {
    const token = req.cookies.accesstoken;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.ACCESS_SECRET_KEY as string) as JwtPayload;
    const teacher = await Teacher.findByPk(decoded.id);
    if (!teacher) return res.status(401).json({ message: "Teacher not found" });

    res.status(200).json({ teacher: { id: teacher.dataValues.id, username: teacher.dataValues.username } });
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const lang = req.headers["accept-language"] || "uz";
    let { username, email, password } = req.body as ICreateUserDto;

    const role = (await User.count()) === 0 ? "superadmin" : "user";
    const foundUser = await User.findOne({ where: { email: email } });

    if (foundUser) {
      return next(
        BaseError.BadRequest(
          403,
          i18next.t("already_registered", { lng: lang })
        )
      );
    }

    const randomCode = Number(
      Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join("")
    );

    await sendVerificationEmail(username, email, randomCode);

    const encodedPassword = await bcryptjs.hash(password, 12);
    await User.create({
      username,
      email,
      password: encodedPassword,
      verification_code: randomCode,
      role,
      timestamp: new Date(Date.now() + 2000 * 60),
    });

    res.status(201).json({
      message: i18next.t("register_success", { lng: lang, email }),
    });
  } catch (error) {
    next(error);
  }
}

async function verify(req: Request, res: Response, next: NextFunction) {
  try {
    const lang = req.headers["accept-language"] || "uz";
    const { email, code } = req.body as IVerifyEmailDto;
    const foundUser = await User.findOne({ where: { email: email } });

    if (!foundUser) {
      return next(
        BaseError.BadRequest(404, "Foydalanuvchi topilmadi")
      );
    }

    const userTimestamp = new Date(foundUser.dataValues.timestamp).getTime();
    const now = Date.now();

    if (
      now <= userTimestamp &&
      Number(code) === Number(foundUser.dataValues.verification_code)
    ) {
      await foundUser.update({ is_verified: true, verification_code: 0 });

      return res.status(200).json({
        message: i18next.t("verification_success", { lng: lang }),
      });
    } else {
      return next(
        BaseError.BadRequest(
          401,
          "Tasdiqlash kodi xato"
        )
      );
    }
  } catch (error) {
    next(error);
  }
}

async function resendVerificationCode(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const lang = req.headers["accept-language"] || "uz";
    const { email } = req.body;
    const foundUser = await User.findOne({ where: { email: email } });

    if (!foundUser) {
      return next(
        BaseError.BadRequest(404, "Foydalanuvchi topilmadi")
      );
    }

    if (foundUser.dataValues.is_verified) {
      return next(
        BaseError.BadRequest(403, "Foydalanuvchi allaqachon ro'yxatdan o'tgan")
      );
    }

    const randomCode = Number(
      Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join("")
    );

    await sendVerificationEmail(
      foundUser.dataValues.username,
      email,
      randomCode
    );
    foundUser.update({
      verification_code: randomCode,
      timestamp: new Date(Date.now() + 2000 * 60),
    });

    res.status(200).json({
      message: "Yangi tasdiqlash kodi yuborildi",
    });
  } catch (error) {
    next(error);
  }
}

async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const lang = req.headers["accept-language"] || "uz";
    const { email, password } = req.body as ILoginDto;
    const foundUser = await User.findOne({ where: { email: email } });

    if (!foundUser) {
      return next(
        BaseError.BadRequest(401, "Foydalanuvchi topilmadi")
      );
    }

    const checkPassword = await bcryptjs.compare(
      password,
      foundUser.dataValues.password
    );
    if (!checkPassword) {
      return next(
        BaseError.BadRequest(401, "Noto'g'ri parol")
      );
    }
    const payload: { id: string; username: string; email: string; role: string } = {
      id: foundUser.dataValues.id,
      username: foundUser.dataValues.username,
      email: foundUser.dataValues.email,
      role: foundUser.dataValues.role,
    };
    const generateAccessToken = (payload: object | null): string => {
      if (!payload) throw new Error("Payload cannot be null");

      const secretKey = process.env.ACCESS_SECRET_KEY;
      if (!secretKey) throw new Error("ACCESS_SECRET_KEY is not defined");

      const expiresIn = process.env.ACCESS_EXPIRING_TIME || "15m";
      return jwt.sign(
        payload,
        secretKey as string,
        { expiresIn } as jwt.SignOptions
      );
    };

    const generateRefreshToken = (payload: object | null): string => {
      if (!payload) throw new Error("Payload cannot be null");

      const secretKey = process.env.REFRESH_SECRET_KEY;
      if (!secretKey) throw new Error("REFRESH_SECRET_KEY is not defined");

      return jwt.sign(
        payload,
        secretKey as string,
        { expiresIn: "7d" } as jwt.SignOptions
      );
    };
    const accesstoken = generateAccessToken(payload);
    const refreshtoken = generateRefreshToken(payload);
    if (foundUser.dataValues.is_verified) {
      const isSecure = req.headers.host?.includes('https') || req.headers.host?.includes('intellectualprogress.uz');
      res.cookie("accesstoken", accesstoken, {
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
      res
        .status(200)
        .json({ message: i18next.t("login_success", { lng: lang }) });
    } else {
      next(BaseError.BadRequest(401, i18next.t("not_verified", { lng: lang })));
    }
  } catch (error) {
    next(error);
  }
}

function logout(req: Request, res: Response, next: NextFunction) {
  jwt.verify(
    req.cookies.refreshtoken,
    process.env.REFRESH_SECRET_KEY as string
  );
  res.clearCookie("accesstoken");
  res.clearCookie("refreshtoken");
  res
    .status(200)
    .json({
      message: i18next.t("logout_success", {
        lng: req.headers["accept-language"] || "uz",
      }),
    });
}

async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, oldPassword, newPassword } = req.body;
    const foundUser = await User.findOne({ where: { email: email } });
    if (!foundUser) {
      return next(
        BaseError.BadRequest(404, "Foydalanuvchi topilmadi")
      );
    }
    const checkPassword = await bcryptjs.compare(
      oldPassword,
      foundUser.dataValues.password
    );
    if (!checkPassword) {
      return next(
        BaseError.BadRequest(401, "Noto'g'ri parol")
      );
    }
    const encodedPassword = await bcryptjs.hash(newPassword, 12);
    await foundUser.update({ password: encodedPassword });
    res.status(200).json({ message: "Parol muvaffaqiyatli o'zgartirildi" });

  } catch (error) {
    next(error);
  }
}

async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies.accesstoken;
    if (!token) return next(BaseError.BadRequest(401, "Token topilmadi"));

    const decoded = jwt.verify(token, process.env.ACCESS_SECRET_KEY as string) as JwtPayload;
    const user = await User.findByPk(decoded.id);
    if (!user) return next(BaseError.BadRequest(404, "Foydalanuvchi topilmadi"));

    res.status(200).json({ user: { id: user.dataValues.id, username: user.dataValues.username, email: user.dataValues.email } });
  } catch (err) {
    next(BaseError.BadRequest(401, "Token xato"));
  }
}

async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, username } = req.body;  
    const foundUser = await User.findOne({ where: { email: email } });
    if (!foundUser) {
      return next(
        BaseError.BadRequest(404, "Foydalanuvchi topilmadi")
      );
    }
    await foundUser.update({ username: username });
    res.status(200).json({ message: "Foydalanuvchi muvaffaqiyatli o'zgartirildi" });
  } catch (error) {
    next(error);
  }
}

export { register, login, verify, logout, resendVerificationCode, checkAuth, checkTeacherAuth, changePassword, getProfile, updateProfile };
