import { RequestHandler, Router } from "express";
import { createTest, deleteTest, getAllTestsByMonthAndYear, getTeacherTests, getTestResults, updateTest } from "../controller/test.ctr";

const testRouter:Router = Router();

testRouter.get("/get_tests", getTeacherTests as RequestHandler)
testRouter.get("/get_test_results/:test_id", getTestResults as RequestHandler)
testRouter.post("/create_test", createTest as RequestHandler)
testRouter.put("/update_test/:test_id", updateTest as RequestHandler)
testRouter.delete("/delete_test/:test_id", deleteTest as RequestHandler)
testRouter.get("/get_all_tests", getAllTestsByMonthAndYear as RequestHandler)

export {
    testRouter
}
