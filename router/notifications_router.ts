import { RequestHandler, Router } from "express"
import { getNotificationsOfStudent, makeNotificationAsRead } from "../controller/notification.ctr"
const NotificationsRouter:Router = Router()

NotificationsRouter.get("/notifications/:id", getNotificationsOfStudent as RequestHandler)
NotificationsRouter.get("/notifications/read/:id", makeNotificationAsRead as RequestHandler)

export {
    NotificationsRouter
}