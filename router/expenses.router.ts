import { Router } from "express";
import { getExpenses, createExpense, updateExpense, deleteExpense, getMonthlyExpenses } from "../controller/expense.ctr";
import { RequestHandler } from "express";

const ExpenseRouter:Router = Router();

ExpenseRouter.get("/get_expenses", getExpenses as RequestHandler);
ExpenseRouter.post("/create_expense", createExpense as RequestHandler);
ExpenseRouter.put("/update_expense/:id", updateExpense as RequestHandler);
ExpenseRouter.delete("/delete_expense/:id", deleteExpense as RequestHandler);
ExpenseRouter.get("/get_monthly_expenses", getMonthlyExpenses as RequestHandler);
export {
    ExpenseRouter
}
