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
exports.getGroups = getGroups;
exports.getOneGroup = getOneGroup;
exports.createGroup = createGroup;
exports.updateGroup = updateGroup;
exports.deleteGroup = deleteGroup;
const group_model_1 = __importDefault(require("../Models/group_model"));
const base_error_1 = require("../Utils/base_error");
const student_model_1 = __importDefault(require("../Models/student_model"));
const lang_1 = __importDefault(require("../Utils/lang"));
function getGroups(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const lang = req.headers["accept-language"] || "uz";
            const groups = yield group_model_1.default.findAll();
            if (groups.length === 0) {
                return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("groups_not_found", { lng: lang })));
            }
            res.status(200).json(groups);
        }
        catch (error) {
            next(error);
        }
    });
}
function getOneGroup(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const lang = req.headers["accept-language"] || "uz";
            const group = yield group_model_1.default.findByPk(req.params.id);
            if (!group) {
                return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("group_not_found", { lng: lang })));
            }
            const studentInThisGroup = yield student_model_1.default.findAll({ where: { group_id: group.dataValues.id } });
            res.status(200).json({ group, studentInThisGroup });
        }
        catch (error) {
            next(error);
        }
    });
}
function createGroup(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const lang = req.headers["accept-language"] || "uz";
            const { group_subject, days, start_time, end_time, teacher_id, teacher_phone, img_url, students_amount, paid_students_amount, } = req.body;
            const group = yield group_model_1.default.create({
                group_subject,
                days,
                start_time,
                end_time,
                teacher_id,
                teacher_phone,
                img_url,
                students_amount,
                paid_students_amount,
            });
            res.status(201).json({
                message: lang_1.default.t("group_created", { lng: lang }),
                group,
            });
        }
        catch (error) {
            next(error);
        }
    });
}
function updateGroup(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const lang = req.headers["accept-language"] || "uz";
            const { group_subject, days, start_time, end_time, teacher_id, teacher_phone, img_url, students_amount, paid_students_amount, } = req.body;
            const group = yield group_model_1.default.findByPk(req.params.id);
            if (!group) {
                return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("group_not_found", { lng: lang })));
            }
            yield group.update({
                group_subject,
                days,
                start_time,
                end_time,
                teacher_id,
                teacher_phone,
                img_url,
                students_amount,
                paid_students_amount,
            });
            res.status(200).json({
                message: lang_1.default.t("group_updated", { lng: lang }),
                group,
            });
        }
        catch (error) {
            next(error);
        }
    });
}
function deleteGroup(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const lang = req.headers["accept-language"] || "uz";
            const group = yield group_model_1.default.findByPk(req.params.id);
            if (!group) {
                return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("group_not_found", { lng: lang })));
            }
            yield group.destroy();
            res.status(200).json({
                message: lang_1.default.t("group_deleted", { lng: lang }),
            });
        }
        catch (error) {
            next(error);
        }
    });
}
