import { Request, Response, NextFunction } from "express";
import Achievement from "../Models/achievement_model";
import { BaseError } from "../Utils/base_error";
import { withBranchScope } from "../Utils/branch_scope.helper";
import Students from "../Models/student_model";

async function getAchievements(req: any, res: Response, next: NextFunction) {
  try {
    const where = withBranchScope(req);

    const achievements = await Achievement.findAll({
      where,
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(achievements);
  } catch (e) {
    next(e);
  }
}

async function getAchievement(req: any, res: Response, next: NextFunction) {
  try {
    const where = withBranchScope(req, { id: req.params.id });

    const achievement = await Achievement.findOne({ where });
    if (!achievement) return res.status(404).json({ message: "Yutuq topilmadi" });

    res.status(200).json(achievement);
  } catch (e) {
    next(e);
  }
}

async function createAchievement(req: any, res: Response, next: NextFunction) {
  try {
    const scope = req.scope;

    const branch_id =
      scope?.all ? (req.body.branch_id || null) : (scope.branchIds?.[0] || null);

    // normalize: eski frontend (entity_id/type) bo'lsa ham ko'tarib olamiz
    const achiever_id = req.body.achiever_id || req.body.entity_id;
    const achiever_type = req.body.achiever_type || req.body.type; // "student" | "teacher"

    const { achievement_title, description, date } = req.body;

    if (!achiever_id || !achiever_type || !achievement_title) {
      return next(BaseError.BadRequest(400, "missing_fields"));
    }

    if (!["student", "teacher"].includes(achiever_type)) {
      return next(BaseError.BadRequest(400, "achiever_type_invalid"));
    }

    const achievement = await Achievement.create({
      achiever_id,
      achiever_type,
      achievement_title,
      description: description || null,
      date: date || null,
      branch_id,
    });

    res.status(201).json(achievement);
  } catch (e) {
    next(e);
  }
}

async function updateAchievement(req: any, res: Response, next: NextFunction) {
  try {
    const where = withBranchScope(req, { id: req.params.id });

    const achievement = await Achievement.findOne({ where });
    if (!achievement) return res.status(404).json({ message: "Topilmadi yoki ruxsat yo'q" });

    const payload: any = {};

    // faqat ruxsat berilgan fieldlar
    if (req.body.achievement_title !== undefined) payload.achievement_title = req.body.achievement_title;
    if (req.body.description !== undefined) payload.description = req.body.description;
    if (req.body.date !== undefined) payload.date = req.body.date;

    // agar achiverni ham tahrirlash kerak bo'lsa:
    const achiever_id = req.body.achiever_id || req.body.entity_id;
    const achiever_type = req.body.achiever_type || req.body.type;

    if (achiever_id) payload.achiever_id = achiever_id;
    if (achiever_type) payload.achiever_type = achiever_type;

    await achievement.update(payload);

    res.status(200).json(achievement);
  } catch (e) {
    next(e);
  }
}

async function deleteAchievement(req: any, res: Response, next: NextFunction) {
  try {
    const where = withBranchScope(req, { id: req.params.id });

    const achievement = await Achievement.findOne({ where });
    if (!achievement) return res.status(404).json({ message: "Topilmadi yoki ruxsat yo'q" });

    await achievement.destroy();
    res.status(200).json({ message: "Yutuq o'chirildi" });
  } catch (e) {
    next(e);
  }
}

export { getAchievements, getAchievement, createAchievement, updateAchievement, deleteAchievement };