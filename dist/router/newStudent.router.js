"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewStudentRouter = void 0;
const express_1 = __importDefault(require("express"));
const new_student_ctr_1 = require("../controller/new-student.ctr");
const auth_guard_middleware_1 = require("../middlewares/auth-guard.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const access_scope_middleware_1 = require("../middlewares/access-scope.middleware");
const NewStudentRouter = express_1.default.Router();
exports.NewStudentRouter = NewStudentRouter;
const secured = [
    auth_guard_middleware_1.authMiddleware,
    (0, role_middleware_1.roleMiddleware)("manager", "director", "superadmin"),
    access_scope_middleware_1.accessScopeMiddleware,
];
NewStudentRouter.get("/get-new-students", ...secured, new_student_ctr_1.getNewStudents);
NewStudentRouter.post("/register-new-student/:token", new_student_ctr_1.registerNewStudentPublic);
NewStudentRouter.put("/update-new-student/:id", ...secured, new_student_ctr_1.updateNewStudent);
NewStudentRouter.delete("/delete-new-student/:id", ...secured, new_student_ctr_1.deleteNewStudent);
