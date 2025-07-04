"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsRouter = void 0;
const express_1 = require("express");
const notification_ctr_1 = require("../controller/notification.ctr");
const NotificationsRouter = (0, express_1.Router)();
exports.NotificationsRouter = NotificationsRouter;
NotificationsRouter.get("/notifications/:id", notification_ctr_1.getNotificationsOfStudent);
NotificationsRouter.get("/notifications/read/:id", notification_ctr_1.makeNotificationAsRead);
NotificationsRouter.get("/notifications_of_center/:id", notification_ctr_1.getNotificationsOfCenter);
NotificationsRouter.get("/notifications_of_center/read/:id", notification_ctr_1.makeNotificationOfCentersAsRead);
