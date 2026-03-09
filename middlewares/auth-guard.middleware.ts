import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../Models/index";
import { NextFunction, Request, Response, RequestHandler } from "express";
import { BaseError } from "../Utils/base_error";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        first_name: string;
        branch_id: string;
      };
      scope?: {
        branchIds: string[];
        all?: boolean;
      };
    }
  }
}

export const authMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {

  const token = req.cookies?.accesstoken;

  if (!token) {
    return next(BaseError.BadRequest(401, "No access token"));
  }

  try {
    const payload = jwt.verify(token, process.env.ACCESS_SECRET_KEY as string) as JwtPayload;

    const user = await User.findByPk(payload.id as string);
    if (!user) {
      return next(BaseError.BadRequest(401, "User not found"));
    }

    req.user = {
      id: String(payload.id),
      role: user.dataValues.role,
      first_name: user.dataValues.first_name,
      branch_id: user.dataValues.branch_id,
    };

    next();
  } catch (err) {
    return next(BaseError.BadRequest(401, "Invalid token"));
  }
};