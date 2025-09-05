import express from "express";
import { createNewStudent, deleteNewStudent, getNewStudents, updateNewStudent } from "../controller/new-student.ctr";
import { RequestHandler } from "express";

const NewStudentRouter = express.Router();

NewStudentRouter.get("/get-new-students", getNewStudents as RequestHandler);
NewStudentRouter.post("/register-new-student", createNewStudent as RequestHandler);
NewStudentRouter.put("/update-new-student/:id", updateNewStudent as RequestHandler);
NewStudentRouter.delete("/delete-new-student/:id", deleteNewStudent as RequestHandler);

export {
    NewStudentRouter
}
