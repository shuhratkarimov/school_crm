import { Router } from "express";
import { authMiddleware } from "../middlewares/auth-guard.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { accessScopeMiddleware } from "../middlewares/access-scope.middleware";
import {
    getMyNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    testSocketNotification,
} from "../controller/user_notification.ctr";

const UserNotificationRouter = Router();

UserNotificationRouter.get(
    "/director-panel/notifications",
    authMiddleware,
    roleMiddleware("superadmin", "director"),
    accessScopeMiddleware,
    getMyNotifications
);

UserNotificationRouter.put(
    "/director-panel/notifications/read-all",
    authMiddleware,
    roleMiddleware("superadmin", "director"),
    accessScopeMiddleware,
    markAllNotificationsRead
);

UserNotificationRouter.put(
    "/director-panel/notifications/:id/read",
    authMiddleware,
    roleMiddleware("superadmin", "director"),
    accessScopeMiddleware,
    markNotificationRead
);

// UserNotificationRouter.get(
//     "/test-socket",
//     authMiddleware,
//     testSocketNotification
// );

export { UserNotificationRouter };