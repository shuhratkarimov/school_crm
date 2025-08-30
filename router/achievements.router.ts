import { RequestHandler, Router } from "express";
import { getAchievements, getAchievement, createAchievement, updateAchievement, deleteAchievement } from "../controller/achievements.ctr";

const AchievementsRouter:Router = Router();

AchievementsRouter.get("/get_achievements", getAchievements as RequestHandler);
AchievementsRouter.get("/get_achievement/:id", getAchievement as RequestHandler);
AchievementsRouter.post("/create_achievement", createAchievement as RequestHandler);
AchievementsRouter.put("/update_achievement/:id", updateAchievement as RequestHandler);
AchievementsRouter.delete("/delete_achievement/:id", deleteAchievement as RequestHandler);

export {
    AchievementsRouter
}