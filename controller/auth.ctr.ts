import { Request, Response, NextFunction } from "express";
import { User } from "../Models/user_model";
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
import lang from "../Utils/lang";

dotenv.config();

async function checkAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.accesstoken;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized at check auth" });
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
    if (!token) return res.status(401).json({ message: "Unauthorized at check teacher auth" });

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
      const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
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
  try {
    const cookie = req.cookies.refreshtoken;
    if (!cookie) return next(BaseError.BadRequest(401, "Token topilmadi"));
    jwt.verify(
      cookie,
      process.env.REFRESH_SECRET_KEY as string
    );
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
    res
      .status(200)
      .json({
        message: i18next.t("logout_success", {
          lng: req.headers["accept-language"] || "uz",
        }),
      });
  } catch (error) {
    next(error);
  }
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

async function getMe(req: Request, res: Response) {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized at getme" });
  }

  res.json({
    id: user.id,
    role: user.role,
    first_name: user.first_name,
  });
};

async function getAllUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await User.findAll();
    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
}

async function getOneUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return next(BaseError.BadRequest(404, "Foydalanuvchi topilmadi"));
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { username, email } = req.body;
    const user = await User.findByPk(id);
    if (!user) return next(BaseError.BadRequest(404, "Foydalanuvchi topilmadi"));
    await user.update({ username: username, email: email });
    res.status(200).json({ message: "Foydalanuvchi muvaffaqiyatli o'zgartirildi" });
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return next(BaseError.BadRequest(404, "Foydalanuvchi topilmadi"));
    await user.destroy();
    res.status(200).json({ message: "Foydalanuvchi muvaffaqiyatli o'chirildi" });
  } catch (error) {
    next(error);
  }
}

async function checkDirectorAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies.accesstoken;
    if (!token) return next(BaseError.BadRequest(401, "Unauthorized at check teacher auth"));

    const decoded = jwt.verify(token, process.env.ACCESS_SECRET_KEY as string) as JwtPayload;
    const director = await User.findByPk(decoded.id);
    if (!director) return next(BaseError.BadRequest(401, "Director not found"));
    if (director.dataValues.role !== "director") {
      return next(BaseError.BadRequest(401, "You are not director"));
    }
    res.status(200).json({ director: { id: director.dataValues.id, username: director.dataValues.username } });
  } catch (err) {
    next(BaseError.BadRequest(401, "Invalid or expired token"));
  }
}

async function directorLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body
    if (!email || !password) return next(BaseError.BadRequest(400, "Email and password are required"))
    const foundDirector = await User.findOne({ where: { email } })
    if (!foundDirector) {
      return next(BaseError.BadRequest(401, "Director not found"))
    }
    if (foundDirector.dataValues.role !== "director" && foundDirector.dataValues.role !== "superadmin") {
      return next(BaseError.BadRequest(401, "Forbidden!"))
    }
    const checkPassword = await bcryptjs.compare(password, foundDirector.dataValues.password)
    if (!checkPassword) {
      return next(BaseError.BadRequest(401, "Invalid password"))
    }
    const payload: { id: string; username: string; email: string; role: string } = {
      id: foundDirector.dataValues.id,
      username: foundDirector.dataValues.username,
      email: foundDirector.dataValues.email,
      role: foundDirector.dataValues.role,
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

    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
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
      .status(200).send({ message: "Director logged in successfully" })
  } catch (error) {
    next(error)
  }
}

export { register, login, verify, logout, resendVerificationCode, checkAuth, checkTeacherAuth, changePassword, getProfile, updateProfile, getMe, getAllUsers, getOneUser, updateUser, deleteUser, checkDirectorAuth, directorLogin };
