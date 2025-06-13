import { RequestHandler, Router } from "express"
import { deleteAppeal, getAppeals, getLastTenDayAppeals, sendTelegramMessage } from "../controller/appeals.ctr"
const AppealRouter:Router = Router()

AppealRouter.get("/get_appeals", getAppeals as RequestHandler)
AppealRouter.get("/get_last_ten_day_appeals", getLastTenDayAppeals as RequestHandler)
AppealRouter.post("/send_telegram_message", sendTelegramMessage as any)
AppealRouter.delete("/delete_appeal/:id", deleteAppeal as RequestHandler)

export {
    AppealRouter
}