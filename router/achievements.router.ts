import { RequestHandler, Router } from "express";
import {
  getAchievements,
  getAchievement,
  createAchievement,
  updateAchievement,
  deleteAchievement,
} from "../controller/achievements.ctr";
import { authMiddleware } from "../middlewares/auth-guard.middleware";
import {roleMiddleware} from "../middlewares/role.middleware"; // bitta universal
import { accessScopeMiddleware } from "../middlewares/access-scope.middleware";

const AchievementsRouter: Router = Router();

AchievementsRouter.get(
  "/get_achievements",
  authMiddleware,
  roleMiddleware("manager", "director", "superadmin"),
  accessScopeMiddleware,
  getAchievements
);

AchievementsRouter.get(
  "/get_achievement/:id",
  authMiddleware,
  roleMiddleware("manager", "director", "superadmin"),
  accessScopeMiddleware,
  getAchievement as RequestHandler
);

AchievementsRouter.post(
  "/create_achievement",
  authMiddleware,
  roleMiddleware("manager", "director", "superadmin"),
  accessScopeMiddleware,
  createAchievement as RequestHandler
);

AchievementsRouter.put(
  "/update_achievement/:id",
  authMiddleware,
  roleMiddleware("manager", "director", "superadmin"),
  accessScopeMiddleware,
  updateAchievement as RequestHandler
);

AchievementsRouter.delete(
  "/delete_achievement/:id",
  authMiddleware,
  roleMiddleware("manager", "director", "superadmin"),
  accessScopeMiddleware,
  deleteAchievement as RequestHandler
);

export { AchievementsRouter };