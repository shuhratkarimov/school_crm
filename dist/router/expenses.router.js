"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseRouter = void 0;
const express_1 = require("express");
const expense_ctr_1 = require("../controller/expense.ctr");
const auth_guard_middleware_1 = require("../middlewares/auth-guard.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const access_scope_middleware_1 = require("../middlewares/access-scope.middleware");
const ExpenseRouter = (0, express_1.Router)();
exports.ExpenseRouter = ExpenseRouter;
const secured = [
    auth_guard_middleware_1.authMiddleware,
    (0, role_middleware_1.roleMiddleware)("manager", "director", "superadmin"),
    access_scope_middleware_1.accessScopeMiddleware,
];
ExpenseRouter.get("/get_expenses", ...secured, expense_ctr_1.getExpenses);
ExpenseRouter.post("/create_expense", ...secured, expense_ctr_1.createExpense);
ExpenseRouter.put("/update_expense/:id", ...secured, expense_ctr_1.updateExpense);
ExpenseRouter.delete("/delete_expense/:id", ...secured, expense_ctr_1.deleteExpense);
ExpenseRouter.get("/get_monthly_expenses", ...secured, expense_ctr_1.getMonthlyExpenses);
