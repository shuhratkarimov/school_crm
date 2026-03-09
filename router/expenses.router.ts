import { Router, RequestHandler } from "express";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getMonthlyExpenses,
} from "../controller/expense.ctr";

import { authMiddleware } from "../middlewares/auth-guard.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { accessScopeMiddleware } from "../middlewares/access-scope.middleware";

const ExpenseRouter: Router = Router();

const secured = [
  authMiddleware,
  roleMiddleware("manager", "director", "superadmin"),
  accessScopeMiddleware,
] as RequestHandler[];

ExpenseRouter.get("/get_expenses", ...secured, getExpenses as RequestHandler);
ExpenseRouter.post("/create_expense", ...secured, createExpense as RequestHandler);
ExpenseRouter.put("/update_expense/:id", ...secured, updateExpense as RequestHandler);
ExpenseRouter.delete("/delete_expense/:id", ...secured, deleteExpense as RequestHandler);
ExpenseRouter.get("/get_monthly_expenses", ...secured, getMonthlyExpenses as RequestHandler);

export { ExpenseRouter };