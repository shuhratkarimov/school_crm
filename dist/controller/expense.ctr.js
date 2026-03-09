"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthlyExpenses = exports.deleteExpense = exports.updateExpense = exports.createExpense = exports.getExpenses = void 0;
const expense_model_1 = __importDefault(require("../Models/expense_model")); // sizda default bo'lsa shunaqa, agar { Expense } bo'lsa moslab o'zgartiring
const database_config_1 = __importDefault(require("../config/database.config"));
const branch_scope_helper_1 = require("../Utils/branch_scope.helper");
const sequelize_1 = require("sequelize");
const getExpenses = async (req, res, next) => {
    try {
        const where = (0, branch_scope_helper_1.withBranchScope)(req);
        const expenses = await expense_model_1.default.findAll({
            where,
            order: [["date", "DESC"]],
        });
        res.json(expenses);
    }
    catch (err) {
        next(err);
    }
};
exports.getExpenses = getExpenses;
const createExpense = async (req, res, next) => {
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
        const expense = await expense_model_1.default.create({ title, amount, date, branch_id });
        res.status(201).json(expense);
    }
    catch (err) {
        next(err);
    }
};
exports.createExpense = createExpense;
const updateExpense = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, amount, date } = req.body;
        // ✅ faqat scope ichidagi expense'ni topamiz
        const where = (0, branch_scope_helper_1.withBranchScope)(req, { id });
        const expense = await expense_model_1.default.findOne({ where });
        if (!expense)
            return res.status(404).json({ message: "Expense not found (or forbidden)" });
        await expense.update({ title, amount, date });
        res.json(expense);
    }
    catch (err) {
        next(err);
    }
};
exports.updateExpense = updateExpense;
const deleteExpense = async (req, res, next) => {
    try {
        const { id } = req.params;
        const where = (0, branch_scope_helper_1.withBranchScope)(req, { id });
        const expense = await expense_model_1.default.findOne({ where });
        if (!expense)
            return res.status(404).json({ message: "Expense not found (or forbidden)" });
        await expense.destroy();
        res.json({ message: "Expense deleted" });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteExpense = deleteExpense;
// Oylik xarajatlar
const getMonthlyExpenses = async (req, res, next) => {
    try {
        const year = new Date().getFullYear();
        // 1) branch scope (faqat branch_id filtri)
        const branchWhere = (0, branch_scope_helper_1.withBranchScope)(req); // <-- faqat branch_id larni qaytarsin
        // 2) year filterni alohida qo'shamiz
        const where = {
            ...branchWhere,
            [sequelize_1.Op.and]: [
                database_config_1.default.where(database_config_1.default.fn("DATE_PART", "year", database_config_1.default.col("date")), year),
            ],
        };
        const monthlyExpenses = (await expense_model_1.default.findAll({
            attributes: [
                [database_config_1.default.fn("TO_CHAR", database_config_1.default.col("date"), "MM"), "month"],
                [database_config_1.default.fn("SUM", database_config_1.default.col("amount")), "totalAmount"],
            ],
            where,
            group: [database_config_1.default.fn("TO_CHAR", database_config_1.default.col("date"), "MM")],
            raw: true,
        }));
        const expensesMap = monthlyExpenses.reduce((acc, row) => {
            acc[row.month] = Number(row.totalAmount);
            return acc;
        }, {});
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
    }
    catch (err) {
        next(err);
    }
};
exports.getMonthlyExpenses = getMonthlyExpenses;
