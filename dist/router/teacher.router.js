"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherRouter = void 0;
const auth_guard_middleware_1 = require("../middlewares/auth-guard.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const access_scope_middleware_1 = require("../middlewares/access-scope.middleware");
const teacher_ctr_1 = require("../controller/teacher.ctr");
const express_1 = require("express");
const TeacherRouter = (0, express_1.Router)();
exports.TeacherRouter = TeacherRouter;
// ✅ PUBLIC / teacher auth
TeacherRouter.post("/teacher_login", teacher_ctr_1.teacherLogin);
TeacherRouter.post("/teacher_logout", teacher_ctr_1.teacherLogout);
TeacherRouter.get("/get_teacher_data", teacher_ctr_1.getTeacherData);
TeacherRouter.get("/get_teacher_groups", teacher_ctr_1.getTeacherGroups);
TeacherRouter.get("/get_teacher_dashboard_student_payments", teacher_ctr_1.getTeacherDashboardStudentPayments);
// pastdagi admin endpointlar shu yerdan keyin:
TeacherRouter.get("/get_teachers", auth_guard_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)("manager", "director", "superadmin"), access_scope_middleware_1.accessScopeMiddleware, teacher_ctr_1.getTeachers);
TeacherRouter.get("/get_one_teacher/:id", auth_guard_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)("manager", "director", "superadmin"), access_scope_middleware_1.accessScopeMiddleware, teacher_ctr_1.getOneTeacher);
TeacherRouter.post("/create_teacher", auth_guard_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)("manager", "director", "superadmin"), access_scope_middleware_1.accessScopeMiddleware, teacher_ctr_1.createTeacher);
TeacherRouter.put("/update_teacher/:id", auth_guard_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)("manager", "director", "superadmin"), access_scope_middleware_1.accessScopeMiddleware, teacher_ctr_1.updateTeacher);
TeacherRouter.delete("/delete_teacher/:id", auth_guard_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)("manager", "director", "superadmin"), access_scope_middleware_1.accessScopeMiddleware, teacher_ctr_1.deleteTeacher);
TeacherRouter.post("/create_payment_teacher", auth_guard_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)("manager", "director", "superadmin"), access_scope_middleware_1.accessScopeMiddleware, teacher_ctr_1.createPayment);
TeacherRouter.get("/get_teacher_balance/:id", auth_guard_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)("manager", "director", "superadmin"), access_scope_middleware_1.accessScopeMiddleware, teacher_ctr_1.getTeacherBalance);
TeacherRouter.get("/get_teacher_payments/:id", auth_guard_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)("manager", "director", "superadmin"), access_scope_middleware_1.accessScopeMiddleware, teacher_ctr_1.getTeacherPayments);
TeacherRouter.get("/get_teacher_salaries", auth_guard_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)("manager", "director", "superadmin"), access_scope_middleware_1.accessScopeMiddleware, teacher_ctr_1.getTeacherSalaries);
TeacherRouter.get("/get_teacher_payments/:id", auth_guard_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)("manager", "director", "superadmin"), access_scope_middleware_1.accessScopeMiddleware, teacher_ctr_1.getTeacherPayments);
