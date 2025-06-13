"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeachers = getTeachers;
exports.getOneTeacher = getOneTeacher;
exports.createTeacher = createTeacher;
exports.updateTeacher = updateTeacher;
exports.deleteTeacher = deleteTeacher;
const teacher_model_1 = __importDefault(require("../Models/teacher_model"));
const base_error_1 = require("../Utils/base_error");
const i18next_1 = __importDefault(require("i18next"));
async function getTeachers(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const teachers = await teacher_model_1.default.findAll();
        if (teachers.length === 0) {
            return next(base_error_1.BaseError.BadRequest(404, i18next_1.default.t("TEACHERS_NOT_FOUND", { lng: lang })));
        }
        res.status(200).json(teachers);
    }
    catch (error) {
        next(error);
    }
}
async function getOneTeacher(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const teacher = await teacher_model_1.default.findByPk(req.params.id);
        if (!teacher) {
            return next(base_error_1.BaseError.BadRequest(404, i18next_1.default.t("TEACHER_NOT_FOUND", { lng: lang })));
        }
        res.status(200).json(teacher);
    }
    catch (error) {
        next(error);
    }
}
async function createTeacher(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const { first_name, last_name, father_name, birth_date, phone_number, subject, got_salary_for_this_month, salary_amount } = req.body;
        const teacher = await teacher_model_1.default.create({
            first_name,
            last_name,
            father_name,
            birth_date,
            phone_number,
            subject,
            got_salary_for_this_month,
            salary_amount
        });
        res.status(200).json(teacher);
    }
    catch (error) {
        next(error);
    }
}
async function updateTeacher(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const { first_name, last_name, father_name, birth_date, phone_number, subject, got_salary_for_this_month, salary_amount } = req.body;
        const teacher = await teacher_model_1.default.findByPk(req.params.id);
        if (!teacher) {
            return next(base_error_1.BaseError.BadRequest(404, i18next_1.default.t("TEACHER_NOT_FOUND", { lng: lang })));
        }
        teacher.update({
            first_name,
            last_name,
            father_name,
            birth_date,
            phone_number,
            subject,
            salary_amount,
            got_salary_for_this_month,
        });
        res.status(200).json(teacher);
    }
    catch (error) {
        next(error);
    }
}
async function deleteTeacher(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const teacher = await teacher_model_1.default.findByPk(req.params.id);
        if (!teacher) {
            return next(base_error_1.BaseError.BadRequest(404, i18next_1.default.t("TEACHER_NOT_FOUND", { lng: lang })));
        }
        teacher.destroy();
        res.status(200).json({
            message: i18next_1.default.t("DATA_DELETED", { lng: lang }),
        });
    }
    catch (error) {
        next(error);
    }
}
