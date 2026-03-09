import { RequestHandler, Router } from "express"
import { getStudents, getOneStudent, createStudent, updateStudent, deleteStudent, getAttendanceByTeacher, getMonthlyStudentStats, makeAttendance, getOneGroupStudents, getTodayAttendanceStats, getAttendanceByDate, updateAttendance, extendAttendanceTime, getExtendAttendanceTime, getPaymentsByStudent } from "../controller/student.ctr";
import { authMiddleware } from "../middlewares/auth-guard.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { accessScopeMiddleware } from "../middlewares/access-scope.middleware";
import { teacherAuthMiddleware } from "../middlewares/teacher-auth.middleware";
const StudentsRouter: Router = Router()

StudentsRouter.get("/get_attendance_by_teacher/:groupId", teacherAuthMiddleware, getAttendanceByTeacher)
StudentsRouter.get("/get_attendance_by_date/:groupId", authMiddleware,
    roleMiddleware("manager", "director", "superadmin"),
    accessScopeMiddleware, getAttendanceByDate as RequestHandler)
StudentsRouter.get("/get_students", authMiddleware,
    roleMiddleware("manager", "director", "superadmin"),
    accessScopeMiddleware, getStudents as RequestHandler)
StudentsRouter.get("/get_one_group_students", authMiddleware,
    roleMiddleware("manager", "director", "superadmin"),
    accessScopeMiddleware, getOneGroupStudents as RequestHandler)
StudentsRouter.post("/make_attendance/:id", teacherAuthMiddleware, makeAttendance as RequestHandler)
StudentsRouter.get("/get_one_student/:id", authMiddleware,
    roleMiddleware("manager", "director", "superadmin"),
    accessScopeMiddleware, getOneStudent as RequestHandler)
StudentsRouter.get("/get_stats", authMiddleware,
    roleMiddleware("manager", "director", "superadmin"),
    accessScopeMiddleware, getMonthlyStudentStats as RequestHandler)
StudentsRouter.post("/create_student", authMiddleware,
    roleMiddleware("manager", "director", "superadmin"),
    accessScopeMiddleware, createStudent as RequestHandler)
StudentsRouter.put("/update_student/:id", authMiddleware,
    roleMiddleware("manager", "director", "superadmin"),
    accessScopeMiddleware, updateStudent as RequestHandler)
StudentsRouter.delete("/delete_student/:id", authMiddleware,
    roleMiddleware("manager", "director", "superadmin"),
    accessScopeMiddleware, deleteStudent as RequestHandler)
StudentsRouter.get("/get_attendance_stats", authMiddleware,
    roleMiddleware("manager", "director", "superadmin"),
    accessScopeMiddleware, getTodayAttendanceStats as RequestHandler)
StudentsRouter.put("/update_attendance/:groupId", teacherAuthMiddleware, updateAttendance as RequestHandler)
StudentsRouter.put("/extend-attendance-time", authMiddleware,
    roleMiddleware("manager", "director", "superadmin"),
    accessScopeMiddleware, extendAttendanceTime as RequestHandler)
StudentsRouter.get("/get_extend_attendance_time/:groupId", authMiddleware,
    roleMiddleware("manager", "director", "superadmin"),
    accessScopeMiddleware, getExtendAttendanceTime as RequestHandler)
StudentsRouter.get("/get_payments_by_student/:student_id", authMiddleware,
    roleMiddleware("manager", "director", "superadmin"),
    accessScopeMiddleware, getPaymentsByStudent as RequestHandler)

export {
    StudentsRouter
}