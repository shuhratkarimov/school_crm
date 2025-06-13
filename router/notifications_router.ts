import { RequestHandler, Router } from "express"
import { getNotificationsOfCenter, getNotificationsOfStudent, makeNotificationAsRead, makeNotificationOfCentersAsRead } from "../controller/notification.ctr"
const NotificationsRouter:Router = Router()

NotificationsRouter.get("/notifications/:id", getNotificationsOfStudent as RequestHandler)
NotificationsRouter.get("/notifications/read/:id", makeNotificationAsRead as RequestHandler)
NotificationsRouter.get("/notifications_of_center/:id", getNotificationsOfCenter as RequestHandler)
NotificationsRouter.get("/notifications_of_center/read/:id", makeNotificationOfCentersAsRead as RequestHandler)
export {
    NotificationsRouter
}