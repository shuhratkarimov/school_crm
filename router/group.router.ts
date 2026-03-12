import { RequestHandler, Router } from "express"
import {
    createGroup,
    deleteGroup,
    getGroups,
    getOneGroup,
    getOneTeacherGroup,
    importStudents,
    updateGroup,
    getReserveStudents,
    updateReserveStudent,
    deleteReserveStudent,
    approveReserveStudent,
    createReserveStudent,
    deleteReserveStudentsBulk,
    approveReserveStudentsBulk,
    startDeleteReserveStudentsBulk,
    startApproveReserveStudentsBulk,
    startImportStudents,
    streamBulkJobProgress,
} from "../controller/group.ctr";
import { getGroupMonthlyPaymentSummary } from "../controller/payments.ctr"
import { getGroupAttendanceSummary, getOneGroupStudentsForTeacher } from "../controller/student.ctr"
import { getOverallAttendanceStats } from "../controller/student.ctr"
const GroupRouter: Router = Router()
import { authMiddleware } from "../middlewares/auth-guard.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { accessScopeMiddleware } from "../middlewares/access-scope.middleware";
import { teacherAuthMiddleware } from "../middlewares/teacher-auth.middleware"
GroupRouter.get("/get_one_group_students_for_teacher", teacherAuthMiddleware, getOneGroupStudentsForTeacher as RequestHandler);
GroupRouter.get("/get_one_teacher_group/:id", teacherAuthMiddleware, getOneTeacherGroup as RequestHandler);
const secured = [
    authMiddleware,
    roleMiddleware("manager", "director", "superadmin"),
    accessScopeMiddleware,
] as RequestHandler[];

GroupRouter.get("/get_groups", ...secured, getGroups as RequestHandler);
GroupRouter.get("/get_one_group/:id", ...secured, getOneGroup as RequestHandler);
GroupRouter.post("/create_group", ...secured, createGroup as RequestHandler);
GroupRouter.put("/update_group/:id", ...secured, updateGroup as RequestHandler);
GroupRouter.delete("/delete_group/:id", ...secured, deleteGroup as RequestHandler);

// GroupRouter.post("/import_students", ...secured, importStudents as RequestHandler);
GroupRouter.get("/get_reserve_students", ...secured, getReserveStudents as RequestHandler);
GroupRouter.put("/update_reserve_student/:id", ...secured, updateReserveStudent as RequestHandler);
GroupRouter.delete("/delete_reserve_student/:id", ...secured, deleteReserveStudent as RequestHandler);
GroupRouter.post("/approve_reserve_student/:id", ...secured, approveReserveStudent as RequestHandler);
GroupRouter.post("/create_reserve_student", ...secured, createReserveStudent as RequestHandler);
// GroupRouter.delete("/delete_reserve_students_bulk", ...secured, deleteReserveStudentsBulk as RequestHandler);
// GroupRouter.post("/approve_reserve_students_bulk", ...secured, approveReserveStudentsBulk as RequestHandler);
// bu summary endpointlar ham scope bilan bo‘lishi kerak (pastda aytaman)
GroupRouter.post("/import_students", ...secured, startImportStudents as RequestHandler);
GroupRouter.delete("/delete_reserve_students_bulk", ...secured, startDeleteReserveStudentsBulk as RequestHandler);
GroupRouter.post("/approve_reserve_students_bulk", ...secured, startApproveReserveStudentsBulk as RequestHandler);
GroupRouter.get("/bulk_job_progress/:jobId", ...secured, streamBulkJobProgress as RequestHandler);
GroupRouter.get("/group-payment-summary/:groupId", ...secured, getGroupMonthlyPaymentSummary as RequestHandler);
GroupRouter.get("/group-attendance-summary/:groupId", ...secured, getGroupAttendanceSummary as RequestHandler);
GroupRouter.get("/overall-attendance-stats", ...secured, getOverallAttendanceStats as RequestHandler);

export {
    GroupRouter
}