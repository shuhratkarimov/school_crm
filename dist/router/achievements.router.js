"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementsRouter = void 0;
const express_1 = require("express");
const achievements_ctr_1 = require("../controller/achievements.ctr");
const auth_guard_middleware_1 = require("../middlewares/auth-guard.middleware");
const role_middleware_1 = require("../middlewares/role.middleware"); // bitta universal
const access_scope_middleware_1 = require("../middlewares/access-scope.middleware");
const AchievementsRouter = (0, express_1.Router)();
exports.AchievementsRouter = AchievementsRouter;
AchievementsRouter.get("/get_achievements", auth_guard_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)("manager", "director", "superadmin"), access_scope_middleware_1.accessScopeMiddleware, achievements_ctr_1.getAchievements);
AchievementsRouter.get("/get_achievement/:id", auth_guard_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)("manager", "director", "superadmin"), access_scope_middleware_1.accessScopeMiddleware, achievements_ctr_1.getAchievement);
AchievementsRouter.post("/create_achievement", auth_guard_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)("manager", "director", "superadmin"), access_scope_middleware_1.accessScopeMiddleware, achievements_ctr_1.createAchievement);
AchievementsRouter.put("/update_achievement/:id", auth_guard_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)("manager", "director", "superadmin"), access_scope_middleware_1.accessScopeMiddleware, achievements_ctr_1.updateAchievement);
AchievementsRouter.delete("/delete_achievement/:id", auth_guard_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)("manager", "director", "superadmin"), access_scope_middleware_1.accessScopeMiddleware, achievements_ctr_1.deleteAchievement);
