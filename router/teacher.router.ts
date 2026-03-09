import { authMiddleware } from "../middlewares/auth-guard.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { accessScopeMiddleware } from "../middlewares/access-scope.middleware";
import { createPayment, getTeacherData, getTeacherDashboardStudentPayments, getTeacherGroups, getTeachers, getTeacherSalaries, getTeacherBalance, getTeacherPayments, getOneTeacher, teacherLogin, teacherLogout, updateTeacher, deleteTeacher, createTeacher } from "../controller/teacher.ctr";
import { Router, RequestHandler } from "express";

const TeacherRouter: Router = Router();

// ✅ PUBLIC / teacher auth
TeacherRouter.post("/teacher_login", teacherLogin as RequestHandler);
TeacherRouter.post("/teacher_logout", teacherLogout as RequestHandler);
TeacherRouter.get("/get_teacher_data", getTeacherData as RequestHandler);
TeacherRouter.get("/get_teacher_groups", getTeacherGroups as RequestHandler);
TeacherRouter.get("/get_teacher_dashboard_student_payments", getTeacherDashboardStudentPayments as RequestHandler);

// pastdagi admin endpointlar shu yerdan keyin:
TeacherRouter.get("/get_teachers", authMiddleware,
  roleMiddleware("manager", "director", "superadmin"),
  accessScopeMiddleware, getTeachers as RequestHandler);
TeacherRouter.get("/get_one_teacher/:id", authMiddleware,
  roleMiddleware("manager", "director", "superadmin"),
  accessScopeMiddleware, getOneTeacher as RequestHandler);
TeacherRouter.post("/create_teacher", authMiddleware,
  roleMiddleware("manager", "director", "superadmin"),
  accessScopeMiddleware, createTeacher as RequestHandler);
TeacherRouter.put("/update_teacher/:id", authMiddleware,
  roleMiddleware("manager", "director", "superadmin"),
  accessScopeMiddleware, updateTeacher as RequestHandler);
TeacherRouter.delete("/delete_teacher/:id", authMiddleware,
  roleMiddleware("manager", "director", "superadmin"),
  accessScopeMiddleware, deleteTeacher as RequestHandler);

TeacherRouter.post("/create_payment_teacher", authMiddleware,
  roleMiddleware("manager", "director", "superadmin"),
  accessScopeMiddleware, createPayment as RequestHandler);
TeacherRouter.get("/get_teacher_balance/:id", authMiddleware,
  roleMiddleware("manager", "director", "superadmin"),
  accessScopeMiddleware, getTeacherBalance as RequestHandler);
TeacherRouter.get("/get_teacher_payments/:id", authMiddleware,
  roleMiddleware("manager", "director", "superadmin"),
  accessScopeMiddleware, getTeacherPayments as RequestHandler);
TeacherRouter.get("/get_teacher_salaries", authMiddleware,
  roleMiddleware("manager", "director", "superadmin"),
  accessScopeMiddleware, getTeacherSalaries as RequestHandler);

TeacherRouter.get("/get_teacher_payments/:id", authMiddleware,
  roleMiddleware("manager", "director", "superadmin"),
  accessScopeMiddleware, getTeacherPayments as RequestHandler);

export { TeacherRouter };