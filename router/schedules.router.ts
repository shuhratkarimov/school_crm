import { getSchedules } from "../controller/schedules.ctr"; 
import { RequestHandler, Router } from "express";
const ScheduleRouter = Router()

ScheduleRouter.get("/get_schedules", getSchedules as RequestHandler)

export default ScheduleRouter