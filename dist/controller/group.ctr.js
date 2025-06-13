"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGroups = getGroups;
exports.getOneGroup = getOneGroup;
exports.createGroup = createGroup;
exports.updateGroup = updateGroup;
exports.deleteGroup = deleteGroup;
const base_error_1 = require("../Utils/base_error");
const student_model_1 = __importDefault(require("../Models/student_model"));
const lang_1 = __importDefault(require("../Utils/lang"));
const index_1 = require("../Models/index");
async function getGroups(req, res, next) {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const groups = await index_1.Group.findAll({
            include: [
                {
                    model: index_1.Teacher,
                    as: "teacher",
                    attributes: ['id', 'first_name', 'last_name', 'phone_number', 'subject'],
                }
            ]
        });
        if (groups.length === 0) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("groups_not_found", { lng: lang })));
        }
        res.status(200).json(groups);
    }
    catch (error) {
        next(error);
    }
}
async function getOneGroup(req, res, next) {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const group = await index_1.Group.findByPk(req.params.id);
        if (!group) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("group_not_found", { lng: lang })));
        }
        const studentInThisGroup = await student_model_1.default.findAll({ where: { group_id: group.dataValues.id } });
        res.status(200).json({ group, studentInThisGroup });
    }
    catch (error) {
        next(error);
    }
}
async function createGroup(req, res, next) {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const { group_subject, days, start_time, end_time, teacher_id, teacher_phone, img_url, students_amount, paid_students_amount, monthly_fee } = req.body;
        const group = await index_1.Group.create({
            group_subject,
            days,
            start_time,
            end_time,
            teacher_id,
            teacher_phone,
            students_amount,
            paid_students_amount,
            monthly_fee
        });
        res.status(201).json({
            message: lang_1.default.t("group_created", { lng: lang }),
            group,
        });
    }
    catch (error) {
        next(error);
    }
}
async function updateGroup(req, res, next) {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const { group_subject, days, start_time, end_time, teacher_id, teacher_phone, students_amount, paid_students_amount, monthly_fee } = req.body;
        const group = await index_1.Group.findByPk(req.params.id);
        if (!group) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("group_not_found", { lng: lang })));
        }
        await group.update({
            group_subject,
            days,
            start_time,
            end_time,
            teacher_id,
            teacher_phone,
            students_amount,
            paid_students_amount,
            monthly_fee
        });
        res.status(200).json({
            message: lang_1.default.t("group_updated", { lng: lang }),
            group,
        });
    }
    catch (error) {
        next(error);
    }
}
async function deleteGroup(req, res, next) {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const group = await index_1.Group.findByPk(req.params.id);
        if (!group) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("group_not_found", { lng: lang })));
        }
        await group.destroy();
        res.status(200).json({
            message: lang_1.default.t("group_deleted", { lng: lang }),
        });
    }
    catch (error) {
        next(error);
    }
}
