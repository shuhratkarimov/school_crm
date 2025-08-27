import { RequestHandler, Router } from "express"
import { getStudents, getOneStudent, createStudent, updateStudent, deleteStudent, getMonthlyStudentStats, makeAttendance, getOneGroupStudents, getTodayAttendanceStats, getAttendanceByDate } from "../controller/student.ctr";
const StudentsRouter:Router = Router()

StudentsRouter.get("/get_attendance_by_date/:groupId", getAttendanceByDate as RequestHandler)
StudentsRouter.get("/get_students", getStudents as RequestHandler)
StudentsRouter.get("/get_one_group_students", getOneGroupStudents as RequestHandler)
StudentsRouter.post("/make_attendance/:id", makeAttendance as RequestHandler)
StudentsRouter.get("/get_one_student/:id", getOneStudent as RequestHandler)
StudentsRouter.get("/get_stats", getMonthlyStudentStats as RequestHandler)
StudentsRouter.post("/create_student", createStudent as RequestHandler)
StudentsRouter.put("/update_student/:id", updateStudent as RequestHandler)
StudentsRouter.delete("/delete_student/:id", deleteStudent as RequestHandler)
StudentsRouter.get("/get_attendance_stats", getTodayAttendanceStats as RequestHandler)

export {
    StudentsRouter
}