import { RequestHandler, Router } from "express"
import { createGroup, deleteGroup, getGroups, getOneGroup, updateGroup } from "../controller/group.ctr"
const GroupRouter:Router = Router()

GroupRouter.get("/get_groups", getGroups as RequestHandler)
GroupRouter.get("/get_one_group/:id", getOneGroup as RequestHandler)
GroupRouter.post("/create_group", createGroup as RequestHandler)
GroupRouter.put("/update_group/:id", updateGroup as RequestHandler)
GroupRouter.delete("/delete_group/:id", deleteGroup as RequestHandler)

export {
    GroupRouter
}