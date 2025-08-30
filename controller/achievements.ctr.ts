import { Request, Response, NextFunction } from "express";
import Achievement from "../Models/achievement_model";
import Student from "../Models/student_model";
import Teacher from "../Models/teacher_model";
import { BaseError } from "../Utils/base_error";

async function getAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const achievements = await Achievement.findAll({
      include: [
        { model: Student, as: "student", required: false },
        { model: Teacher, as: "teacher", required: false },
      ],
    });
    res.status(200).json(achievements);
  } catch (error) {
    next(error);
  }
}

async function getAchievement(req: Request, res: Response, next: NextFunction) {
  try {
    const achievement = await Achievement.findByPk(req.params.id);
    if (!achievement) return next(BaseError.BadRequest(404, "Yutuq topilmadi"));
    res.status(200).json(achievement);
  } catch (error) {
    next(error);
  }
}

async function createAchievement(req: Request, res: Response, next: NextFunction) {
  try {
    const { entity_id, type, achievement_title, description, date } = req.body;

    const achievement = await Achievement.create({
      achiever_id: entity_id,
      achiever_type: type === "students" ? "student" : "teacher",
      type,
      achievement_title,
      description,
      date,
    });

    res.status(201).json(achievement);
  } catch (error) {
    next(error);
  }
}

async function updateAchievement(req: Request, res: Response, next: NextFunction) {
  try {
    const { entity_id, type, achievement_title, description, date } = req.body;
    const achievement = await Achievement.findByPk(req.params.id);
    if (!achievement) return next(BaseError.BadRequest(404, "Yutuq topilmadi"));
    await achievement.update({ achiever_id: entity_id, achiever_type: type === "students" ? "student" : "teacher", type, achievement_title, description, date });
    res.status(200).json(achievement);
  } catch (error) {
    next(error);
  }
}

async function deleteAchievement(req: Request, res: Response, next: NextFunction) {
  try {
    const achievement = await Achievement.findByPk(req.params.id);
    if (!achievement) return next(BaseError.BadRequest(404, "Yutuq topilmadi"));
    await achievement.destroy();
    res.status(200).json({ message: "Yutuq o'chirildi" });
  } catch (error) {
    next(error);
  }
}

export { getAchievements, getAchievement, createAchievement, updateAchievement, deleteAchievement };