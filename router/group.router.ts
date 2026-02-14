import { RequestHandler, Router } from "express"
import { createGroup, deleteGroup, getGroups, getOneGroup, importStudents, updateGroup, getReserveStudents, updateReserveStudent, deleteReserveStudent, approveReserveStudent, createReserveStudent } from "../controller/group.ctr"
import { getGroupMonthlyPaymentSummary } from "../controller/payments.ctr"
import { getGroupAttendanceSummary } from "../controller/student.ctr"
import { getOverallAttendanceStats } from "../controller/student.ctr"
const GroupRouter: Router = Router()

GroupRouter.get("/get_groups", getGroups as RequestHandler)
GroupRouter.get("/get_one_group/:id", getOneGroup as RequestHandler)
GroupRouter.post("/create_group", createGroup as RequestHandler)
GroupRouter.put("/update_group/:id", updateGroup as RequestHandler)
GroupRouter.delete("/delete_group/:id", deleteGroup as RequestHandler)
GroupRouter.post("/import_students", importStudents as RequestHandler)
GroupRouter.get("/get_reserve_students", getReserveStudents as RequestHandler)
GroupRouter.put("/update_reserve_student/:id", updateReserveStudent as RequestHandler)
GroupRouter.delete("/delete_reserve_student/:id", deleteReserveStudent as RequestHandler)
GroupRouter.post("/approve_reserve_student/:id", approveReserveStudent as RequestHandler)
GroupRouter.post("/create_reserve_student", createReserveStudent as RequestHandler)
GroupRouter.get("/group-payment-summary/:groupId", getGroupMonthlyPaymentSummary as RequestHandler);
GroupRouter.get('/group-attendance-summary/:groupId', getGroupAttendanceSummary as RequestHandler);
GroupRouter.get('/overall-attendance-stats', getOverallAttendanceStats as RequestHandler);
export {
    GroupRouter
}