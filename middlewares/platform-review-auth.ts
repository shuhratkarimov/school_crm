import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import Teacher from '../Models/teacher_model';
import { User } from '../Models/user_model';
import { BaseError } from '../Utils/base_error';

export const platformReviewAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.accesstoken;

    if (!token) {
      return next(BaseError.BadRequest(401, 'Token topilmadi'));
    }

    const decoded = jwt.verify(
      token,
      process.env.ACCESS_SECRET_KEY as string
    ) as JwtPayload;

    if (!decoded?.id) {
      return next(BaseError.BadRequest(401, 'Token xato'));
    }

    const id = String(decoded.id);

    const teacher = await Teacher.findByPk(id);

    if (teacher) {
      req.teacher = { id };
      req.actor = { id };
      req.actorType = 'teacher';
      return next();
    }

    const user = await User.findByPk(id);

    if (user) {
      req.user = {
        id,
        role: user.dataValues.role,
        first_name: user.dataValues.first_name,
        branch_id: user.dataValues.branch_id,
      };

      req.actor = { id };
      req.actorType = 'user';
      return next();
    }

    return next(BaseError.BadRequest(401, 'Foydalanuvchi topilmadi'));
  } catch (_error) {
    return next(BaseError.BadRequest(401, 'Token xato'));
  }
};