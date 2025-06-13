"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
function getTeachers(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const lang = ((_a = req.headers["accept-language"]) === null || _a === void 0 ? void 0 : _a.split(",")[0]) || "uz";
            const teachers = yield teacher_model_1.default.findAll();
            if (teachers.length === 0) {
                return next(base_error_1.BaseError.BadRequest(404, i18next_1.default.t("TEACHERS_NOT_FOUND", { lng: lang })));
            }
            res.status(200).json(teachers);
        }
        catch (error) {
            next(error);
        }
    });
}
function getOneTeacher(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const lang = ((_a = req.headers["accept-language"]) === null || _a === void 0 ? void 0 : _a.split(",")[0]) || "uz";
            const teacher = yield teacher_model_1.default.findByPk(req.params.id);
            if (!teacher) {
                return next(base_error_1.BaseError.BadRequest(404, i18next_1.default.t("TEACHER_NOT_FOUND", { lng: lang })));
            }
            res.status(200).json(teacher);
        }
        catch (error) {
            next(error);
        }
    });
}
function createTeacher(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const lang = ((_a = req.headers["accept-language"]) === null || _a === void 0 ? void 0 : _a.split(",")[0]) || "uz";
            const { first_name, last_name, father_name, birth_date, phone_number, subject, img_url, got_salary_for_this_month, } = req.body;
            const teacher = yield teacher_model_1.default.create({
                first_name,
                last_name,
                father_name,
                birth_date,
                phone_number,
                subject,
                img_url,
                got_salary_for_this_month,
            });
            res.status(200).json(teacher);
        }
        catch (error) {
            next(error);
        }
    });
}
function updateTeacher(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const lang = ((_a = req.headers["accept-language"]) === null || _a === void 0 ? void 0 : _a.split(",")[0]) || "uz";
            const { first_name, last_name, father_name, birth_date, phone_number, subject, img_url, got_salary_for_this_month, } = req.body;
            const teacher = yield teacher_model_1.default.findByPk(req.params.id);
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
                img_url,
                got_salary_for_this_month,
            });
            res.status(200).json(teacher);
        }
        catch (error) {
            next(error);
        }
    });
}
function deleteTeacher(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const lang = ((_a = req.headers["accept-language"]) === null || _a === void 0 ? void 0 : _a.split(",")[0]) || "uz";
            const teacher = yield teacher_model_1.default.findByPk(req.params.id);
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
    });
}
