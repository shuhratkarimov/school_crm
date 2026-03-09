import { Request, Response, NextFunction } from "express";
import Expense from "../Models/expense_model"; // sizda default bo'lsa shunaqa, agar { Expense } bo'lsa moslab o'zgartiring
import sequelize from "../config/database.config";
import { withBranchScope } from "../Utils/branch_scope.helper";
import { Op } from "sequelize";

interface IMonthlyExpenseRow {
  month: string;
  totalAmount: string | number;
}

export const getExpenses = async (req: any, res: Response, next: NextFunction) => {
  try {
    const where = withBranchScope(req);

    const expenses = await Expense.findAll({
      where,
      order: [["date", "DESC"]],
    });

    res.json(expenses);
  } catch (err) {
    next(err);
  }
};

export const createExpense = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { title, amount, date, branch_id: bodyBranchId } = req.body;

    const scope = req.scope;

    // superadmin bo'lsa branch_id ni body'dan ham qabul qilish mumkin
    // manager/director bo'lsa scope branchIds orqali majburan qo'yiladi
    const branch_id = scope?.all
      ? (bodyBranchId || null)
      : (scope.branchIds?.[0] || null);

    if (!branch_id) {
      return res.status(400).json({ message: "branch_id required" });
    }

    const expense = await Expense.create({ title, amount, date, branch_id });
    res.status(201).json(expense);
  } catch (err) {
    next(err);
  }
};

export const updateExpense = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, amount, date } = req.body;

    // ✅ faqat scope ichidagi expense'ni topamiz
    const where = withBranchScope(req, { id });

    const expense = await Expense.findOne({ where });
    if (!expense) return res.status(404).json({ message: "Expense not found (or forbidden)" });

    await expense.update({ title, amount, date });
    res.json(expense);
  } catch (err) {
    next(err);
  }
};

export const deleteExpense = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const where = withBranchScope(req, { id });

    const expense = await Expense.findOne({ where });
    if (!expense) return res.status(404).json({ message: "Expense not found (or forbidden)" });

    await expense.destroy();
    res.json({ message: "Expense deleted" });
  } catch (err) {
    next(err);
  }
};

// Oylik xarajatlar
export const getMonthlyExpenses = async (req: any, res: Response, next: NextFunction) => {
  try {
    const year = new Date().getFullYear();

    // 1) branch scope (faqat branch_id filtri)
    const branchWhere = withBranchScope(req); // <-- faqat branch_id larni qaytarsin

    // 2) year filterni alohida qo'shamiz
    const where = {
      ...branchWhere,
      [Op.and]: [
        sequelize.where(
          sequelize.fn("DATE_PART", "year", sequelize.col("date")),
          year
        ),
      ],
    };  

    const monthlyExpenses = (await Expense.findAll({
      attributes: [
        [sequelize.fn("TO_CHAR", sequelize.col("date"), "MM"), "month"],
        [sequelize.fn("SUM", sequelize.col("amount")), "totalAmount"],
      ],
      where,
      group: [sequelize.fn("TO_CHAR", sequelize.col("date"), "MM")],
      raw: true,
    })) as unknown as IMonthlyExpenseRow[];

    const expensesMap = monthlyExpenses.reduce((acc: Record<string, number>, row) => {
      acc[row.month] = Number(row.totalAmount);
      return acc;
    }, {} as Record<string, number>);

    const monthNames = [
      "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
      "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
    ];

    const result = Array.from({ length: 12 }, (_, i) => {
      const month = String(i + 1).padStart(2, "0");
      return {
        month: `${year}-${month}`,
        monthName: monthNames[i],
        jami: expensesMap[month] || 0,
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};