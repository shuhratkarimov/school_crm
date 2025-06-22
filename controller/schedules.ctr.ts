import { NextFunction, Request, Response } from "express";
import { Group, Schedule, Teacher } from "../Models/index";

export async function getSchedules(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const lang = req.headers["accept-language"] || "uz";
      const schedules = await Schedule.findAll({
        include: [
          {
            model: Teacher,
            as: "teacher",
            attributes: ["first_name", "last_name"]
          },
          {
            model: Group,
            as: "group",
            attributes: ["group_subject"]
          }
        ]
      })      
      res.status(200).json(schedules);
    } catch (error: any) {
      next(error);
    }
  }