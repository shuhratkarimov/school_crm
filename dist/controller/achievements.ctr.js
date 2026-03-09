"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAchievements = getAchievements;
exports.getAchievement = getAchievement;
exports.createAchievement = createAchievement;
exports.updateAchievement = updateAchievement;
exports.deleteAchievement = deleteAchievement;
const achievement_model_1 = __importDefault(require("../Models/achievement_model"));
const base_error_1 = require("../Utils/base_error");
const branch_scope_helper_1 = require("../Utils/branch_scope.helper");
async function getAchievements(req, res, next) {
    try {
        const where = (0, branch_scope_helper_1.withBranchScope)(req);
        const achievements = await achievement_model_1.default.findAll({
            where,
            order: [["created_at", "DESC"]],
        });
        res.status(200).json(achievements);
    }
    catch (e) {
        next(e);
    }
}
async function getAchievement(req, res, next) {
    try {
        const where = (0, branch_scope_helper_1.withBranchScope)(req, { id: req.params.id });
        const achievement = await achievement_model_1.default.findOne({ where });
        if (!achievement)
            return res.status(404).json({ message: "Yutuq topilmadi" });
        res.status(200).json(achievement);
    }
    catch (e) {
        next(e);
    }
}
async function createAchievement(req, res, next) {
    try {
        const scope = req.scope;
        const branch_id = scope?.all ? (req.body.branch_id || null) : (scope.branchIds?.[0] || null);
        // normalize: eski frontend (entity_id/type) bo'lsa ham ko'tarib olamiz
        const achiever_id = req.body.achiever_id || req.body.entity_id;
        const achiever_type = req.body.achiever_type || req.body.type; // "student" | "teacher"
        const { achievement_title, description, date } = req.body;
        if (!achiever_id || !achiever_type || !achievement_title) {
            return next(base_error_1.BaseError.BadRequest(400, "missing_fields"));
        }
        if (!["student", "teacher"].includes(achiever_type)) {
            return next(base_error_1.BaseError.BadRequest(400, "achiever_type_invalid"));
        }
        const achievement = await achievement_model_1.default.create({
            achiever_id,
            achiever_type,
            achievement_title,
            description: description || null,
            date: date || null,
            branch_id,
        });
        res.status(201).json(achievement);
    }
    catch (e) {
        next(e);
    }
}
async function updateAchievement(req, res, next) {
    try {
        const where = (0, branch_scope_helper_1.withBranchScope)(req, { id: req.params.id });
        const achievement = await achievement_model_1.default.findOne({ where });
        if (!achievement)
            return res.status(404).json({ message: "Topilmadi yoki ruxsat yo'q" });
        const payload = {};
        // faqat ruxsat berilgan fieldlar
        if (req.body.achievement_title !== undefined)
            payload.achievement_title = req.body.achievement_title;
        if (req.body.description !== undefined)
            payload.description = req.body.description;
        if (req.body.date !== undefined)
            payload.date = req.body.date;
        // agar achiverni ham tahrirlash kerak bo'lsa:
        const achiever_id = req.body.achiever_id || req.body.entity_id;
        const achiever_type = req.body.achiever_type || req.body.type;
        if (achiever_id)
            payload.achiever_id = achiever_id;
        if (achiever_type)
            payload.achiever_type = achiever_type;
        await achievement.update(payload);
        res.status(200).json(achievement);
    }
    catch (e) {
        next(e);
    }
}
async function deleteAchievement(req, res, next) {
    try {
        const where = (0, branch_scope_helper_1.withBranchScope)(req, { id: req.params.id });
        const achievement = await achievement_model_1.default.findOne({ where });
        if (!achievement)
            return res.status(404).json({ message: "Topilmadi yoki ruxsat yo'q" });
        await achievement.destroy();
        res.status(200).json({ message: "Yutuq o'chirildi" });
    }
    catch (e) {
        next(e);
    }
}
