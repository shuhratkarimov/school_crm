import { RequestHandler, Router } from "express"
import { createPayment, createTeacher, deleteTeacher, getOneTeacher, getTeacherBalance, getTeacherDashboardStudentPayments, getTeacherData, getTeacherGroups, getTeacherPayments, getTeachers, teacherLogin, teacherLogout, updateTeacher } from "../controller/teacher.ctr"
const TeacherRouter: Router = Router()

TeacherRouter.get("/get_teachers", getTeachers as RequestHandler)
TeacherRouter.get("/get_one_teacher/:id", getOneTeacher as RequestHandler)
TeacherRouter.post("/create_teacher", createTeacher as RequestHandler)
TeacherRouter.put("/update_teacher/:id", updateTeacher as RequestHandler)
TeacherRouter.delete("/delete_teacher/:id", deleteTeacher as RequestHandler)
TeacherRouter.get("/get_teacher_groups", getTeacherGroups as RequestHandler)
TeacherRouter.post("/teacher_login", teacherLogin as RequestHandler)
TeacherRouter.post("/create_payment_teacher", createPayment as RequestHandler)
TeacherRouter.get("/get_teacher_balance/:id", getTeacherBalance as RequestHandler)
TeacherRouter.get("/get_teacher_payments/:id", getTeacherPayments as RequestHandler)
TeacherRouter.get("/get_teacher_data", getTeacherData as RequestHandler)
TeacherRouter.get("/get_teacher_dashboard_student_payments", getTeacherDashboardStudentPayments as RequestHandler)
TeacherRouter.post("/teacher_logout", teacherLogout as RequestHandler)

export {
    TeacherRouter
}