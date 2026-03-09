import { RequestHandler, Router } from "express";
import {
  createTest,
  deleteTest,
  getAllTestsByMonthAndYear,
  getTeacherTests,
  getTestResults,
  sendTestResultsToParents,
  updateTest,
  getTestResultsByAdmin
} from "../controller/test.ctr";

import { teacherAuthMiddleware } from "../middlewares/teacher-auth.middleware"; 
import { authMiddleware } from "../middlewares/auth-guard.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { accessScopeMiddleware } from "../middlewares/access-scope.middleware";

const testRouter: Router = Router();

testRouter.get("/get_tests", teacherAuthMiddleware, getTeacherTests as RequestHandler);
testRouter.get("/get_test_results_by_admin/:test_id", authMiddleware, roleMiddleware("superadmin", "manager", "director"), accessScopeMiddleware, getTestResultsByAdmin)
testRouter.get("/get_test_results/:test_id", teacherAuthMiddleware, getTestResults as RequestHandler);
testRouter.post("/create_test", teacherAuthMiddleware, createTest as RequestHandler);
testRouter.put("/update_test/:test_id", teacherAuthMiddleware, updateTest as RequestHandler);
testRouter.delete("/delete_test/:test_id", teacherAuthMiddleware, deleteTest as RequestHandler);
testRouter.post("/send_test_sms/:test_id", teacherAuthMiddleware, sendTestResultsToParents as RequestHandler);

testRouter.get("/get_all_tests", authMiddleware, roleMiddleware("superadmin", "manager", "director"), accessScopeMiddleware, getAllTestsByMonthAndYear as RequestHandler);

export { testRouter };