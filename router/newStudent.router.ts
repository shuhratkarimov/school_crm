import express, { RequestHandler } from "express";
import {
  deleteNewStudent,
  getNewStudents,
  registerNewStudentPublic,
  updateNewStudent
} from "../controller/new-student.ctr";

import { authMiddleware } from "../middlewares/auth-guard.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { accessScopeMiddleware } from "../middlewares/access-scope.middleware";

const NewStudentRouter = express.Router();

const secured = [
  authMiddleware,
  roleMiddleware("manager", "director", "superadmin"),
  accessScopeMiddleware,
] as RequestHandler[];

NewStudentRouter.get("/get-new-students", ...secured, getNewStudents as RequestHandler);
NewStudentRouter.post("/register-new-student/:token", registerNewStudentPublic as RequestHandler);
NewStudentRouter.put("/update-new-student/:id", ...secured, updateNewStudent as RequestHandler);
NewStudentRouter.delete("/delete-new-student/:id", ...secured, deleteNewStudent as RequestHandler);

export { NewStudentRouter };