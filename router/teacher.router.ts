import { RequestHandler, Router } from "express"
import { createTeacher, deleteTeacher, getOneTeacher, getTeachers, updateTeacher } from "../controller/teacher.ctr"
const TeacherRouter:Router = Router()

TeacherRouter.get("/get_teachers", getTeachers as RequestHandler)
TeacherRouter.get("/get_one_teacher/:id", getOneTeacher as RequestHandler)
TeacherRouter.post("/create_teacher", createTeacher as RequestHandler)
TeacherRouter.put("/update_teacher/:id", updateTeacher as RequestHandler)
TeacherRouter.delete("/delete_teacher/:id", deleteTeacher as RequestHandler)

export {
    TeacherRouter
}