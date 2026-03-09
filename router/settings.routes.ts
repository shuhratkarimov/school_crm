import { Router } from "express";
import { authMiddleware } from "../middlewares/auth-guard.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { accessScopeMiddleware } from "../middlewares/access-scope.middleware";
import {
  getMySettings,
  updateMyProfile,
  updateMyPassword,
  updateMyNotifications,
  updateMyPreferences,
} from "../controller/settings.ctr";

const SettingsRouter = Router();

SettingsRouter.get(
  "/director-panel/settings",
  authMiddleware,
  roleMiddleware("superadmin", "director"),
  accessScopeMiddleware,
  getMySettings
);

SettingsRouter.put(
  "/director-panel/settings/profile",
  authMiddleware,
  roleMiddleware("superadmin", "director"),
  accessScopeMiddleware,
  updateMyProfile
);

SettingsRouter.put(
  "/director-panel/settings/password",
  authMiddleware,
  roleMiddleware("superadmin", "director"),
  accessScopeMiddleware,
  updateMyPassword
);

SettingsRouter.put(
  "/director-panel/settings/notifications",
  authMiddleware,
  roleMiddleware("superadmin", "director"),
  accessScopeMiddleware,
  updateMyNotifications
);

SettingsRouter.put(
  "/director-panel/settings/preferences",
  authMiddleware,
  roleMiddleware("superadmin", "director"),
  accessScopeMiddleware,
  updateMyPreferences
);

export { SettingsRouter };