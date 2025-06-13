import { RequestHandler, Router } from "express"
import { createCenter, deleteCenter, getCenters, getOneCenter, getStats, updateCenter } from "../controller/center.ctr"
const CenterRouter:Router = Router()

CenterRouter.get("/get_centers", getCenters as RequestHandler)
CenterRouter.get("/get_one_center/:id", getOneCenter as RequestHandler)
CenterRouter.post("/create_center", createCenter as RequestHandler)
CenterRouter.put("/update_center/:id", updateCenter as RequestHandler)
CenterRouter.delete("/delete_center/:id", deleteCenter as RequestHandler)
CenterRouter.get("/get_dashboard_stats", getStats as RequestHandler)

export {
    CenterRouter
}