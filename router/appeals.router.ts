import { RequestHandler, Router } from "express"
import { getAppeals, getLastTenDayAppeals } from "../controller/appeals.ctr"
const AppealRouter:Router = Router()

AppealRouter.get("/get_appeals", getAppeals as RequestHandler)
AppealRouter.get("/get_last_ten_day_appeals", getLastTenDayAppeals as RequestHandler)

export {
    AppealRouter
}