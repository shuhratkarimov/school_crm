import { Request, Response, NextFunction } from "express";
import { Expense } from "../Models/expense_model";
import sequelize from "../config/database.config";

interface IMonthlyExpenseRow {
    month: string;
    totalAmount: string | number;
}


export const getExpenses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const expenses = await Expense.findAll({ order: [["date", "DESC"]] });
        res.json(expenses);
    } catch (err) {
        next(err);
    }
};

export const createExpense = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, amount, date } = req.body;
        const expense = await Expense.create({ title, amount, date });
        res.status(201).json(expense);
    } catch (err) {
        next(err);
    }
};

export const updateExpense = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { title, amount, date } = req.body;
        const expense = await Expense.findByPk(id);
        if (!expense) return res.status(404).json({ message: "Expense not found" });

        await expense.update({ title, amount, date });
        res.json(expense);
    } catch (err) {
        next(err);
    }
};

export const deleteExpense = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const expense = await Expense.findByPk(id);
        if (!expense) return res.status(404).json({ message: "Expense not found" });

        await expense.destroy();
        res.json({ message: "Expense deleted" });
    } catch (err) {
        next(err);
    }
};

// Oylik xarajatlarni olish
export const getMonthlyExpenses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const year = new Date().getFullYear();

        const monthlyExpenses = await Expense.findAll({
            attributes: [
                [sequelize.fn("TO_CHAR", sequelize.col("date"), "MM"), "month"],
                [sequelize.fn("SUM", sequelize.col("amount")), "totalAmount"],
            ],
            where: sequelize.where(
                sequelize.fn("DATE_PART", "year", sequelize.col("date")),
                year
            ),
            group: [sequelize.fn("TO_CHAR", sequelize.col("date"), "MM")],
            raw: true,
        }) as unknown as IMonthlyExpenseRow[];

        const expensesMap = monthlyExpenses.reduce((acc: Record<string, number>, row: IMonthlyExpenseRow) => {
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
