import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { BaseError } from "../Utils/base_error";


declare global {
  namespace Express {
    interface Request {
      teacher?: {
        id: string;
      };
    }
  }
}

export function teacherAuthMiddleware(req: any, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies.accesstoken;
    if (!token) return next(BaseError.BadRequest(401, "Token topilmadi"));

    const decoded = jwt.verify(token, process.env.ACCESS_SECRET_KEY as string) as JwtPayload;

    if (!decoded?.id) return next(BaseError.BadRequest(401, "Token xato"));
    req.teacher = { id: decoded.id };
    return next();
  } catch (e) {
    return next(BaseError.BadRequest(401, "Token xato"));
  }
}