"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupRouter = void 0;
const express_1 = require("express");
const group_ctr_1 = require("../controller/group.ctr");
const payments_ctr_1 = require("../controller/payments.ctr");
const student_ctr_1 = require("../controller/student.ctr");
const student_ctr_2 = require("../controller/student.ctr");
const GroupRouter = (0, express_1.Router)();
exports.GroupRouter = GroupRouter;
const auth_guard_middleware_1 = require("../middlewares/auth-guard.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const access_scope_middleware_1 = require("../middlewares/access-scope.middleware");
const teacher_auth_middleware_1 = require("../middlewares/teacher-auth.middleware");
GroupRouter.get("/get_one_group_students_for_teacher", teacher_auth_middleware_1.teacherAuthMiddleware, student_ctr_1.getOneGroupStudentsForTeacher);
GroupRouter.get("/get_one_teacher_group/:id", teacher_auth_middleware_1.teacherAuthMiddleware, group_ctr_1.getOneTeacherGroup);
const secured = [
    auth_guard_middleware_1.authMiddleware,
    (0, role_middleware_1.roleMiddleware)("manager", "director", "superadmin"),
    access_scope_middleware_1.accessScopeMiddleware,
];
GroupRouter.get("/get_groups", ...secured, group_ctr_1.getGroups);
GroupRouter.get("/get_one_group/:id", ...secured, group_ctr_1.getOneGroup);
GroupRouter.post("/create_group", ...secured, group_ctr_1.createGroup);
GroupRouter.put("/update_group/:id", ...secured, group_ctr_1.updateGroup);
GroupRouter.delete("/delete_group/:id", ...secured, group_ctr_1.deleteGroup);
GroupRouter.post("/import_students", ...secured, group_ctr_1.importStudents);
GroupRouter.get("/get_reserve_students", ...secured, group_ctr_1.getReserveStudents);
GroupRouter.put("/update_reserve_student/:id", ...secured, group_ctr_1.updateReserveStudent);
GroupRouter.delete("/delete_reserve_student/:id", ...secured, group_ctr_1.deleteReserveStudent);
GroupRouter.post("/approve_reserve_student/:id", ...secured, group_ctr_1.approveReserveStudent);
GroupRouter.post("/create_reserve_student", ...secured, group_ctr_1.createReserveStudent);
// bu summary endpointlar ham scope bilan bo‘lishi kerak (pastda aytaman)
GroupRouter.get("/group-payment-summary/:groupId", ...secured, payments_ctr_1.getGroupMonthlyPaymentSummary);
GroupRouter.get("/group-attendance-summary/:groupId", ...secured, student_ctr_1.getGroupAttendanceSummary);
GroupRouter.get("/overall-attendance-stats", ...secured, student_ctr_2.getOverallAttendanceStats);
