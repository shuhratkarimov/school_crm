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
exports.getCenters = getCenters;
exports.getOneCenter = getOneCenter;
exports.createCenter = createCenter;
exports.updateCenter = updateCenter;
exports.deleteCenter = deleteCenter;
exports.getStats = getStats;
const base_error_1 = require("../Utils/base_error");
const student_model_1 = __importDefault(require("../Models/student_model"));
const lang_1 = __importDefault(require("../Utils/lang"));
const center_model_1 = __importDefault(require("../Models/center.model"));
const user_model_1 = __importDefault(require("../Models/user_model"));
const teacher_model_1 = __importDefault(require("../Models/teacher_model"));
const group_model_1 = __importDefault(require("../Models/group_model"));
function getCenters(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const lang = req.headers["accept-language"] || "uz";
            const centers = yield center_model_1.default.findAll();
            if (centers.length === 0) {
                return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("centers_not_found", { lng: lang })));
            }
            res.status(200).json(centers);
        }
        catch (error) {
            next(error);
        }
    });
}
function getOneCenter(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const lang = req.headers["accept-language"] || "uz";
            const center = yield center_model_1.default.findByPk(req.params.id);
            if (!center) {
                return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("center_not_found", { lng: lang })));
            }
            res.status(200).json(center);
        }
        catch (error) {
            next(error);
        }
    });
}
function createCenter(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const lang = req.headers["accept-language"] || "uz";
            const { name, address, owner, phone, login, password, paymentDate, status, } = req.body;
            const center = yield center_model_1.default.create({
                name,
                address,
                owner,
                phone,
                login,
                password,
                paymentDate,
                status,
            });
            res.status(201).json({
                message: lang_1.default.t("center_created", { lng: lang }),
                center,
            });
        }
        catch (error) {
            next(error);
        }
    });
}
function updateCenter(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const lang = req.headers["accept-language"] || "uz";
            const { name, address, owner, phone, login, password, paymentDate, status, } = req.body;
            const center = yield center_model_1.default.findByPk(req.params.id);
            if (!center) {
                return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("center_not_found", { lng: lang })));
            }
            yield center.update({
                name,
                address,
                owner,
                phone,
                login,
                password,
                paymentDate,
                status,
            });
            res.status(200).json({
                message: lang_1.default.t("center_updated", { lng: lang }),
                center,
            });
        }
        catch (error) {
            next(error);
        }
    });
}
function deleteCenter(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const lang = req.headers["accept-language"] || "uz";
            const center = yield center_model_1.default.findByPk(req.params.id);
            if (!center) {
                return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("center_not_found", { lng: lang })));
            }
            yield center.destroy();
            res.status(200).json({
                message: lang_1.default.t("center_deleted", { lng: lang }),
            });
        }
        catch (error) {
            next(error);
        }
    });
}
function getStats(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const lang = req.headers["accept-language"] || "uz";
            const center = yield center_model_1.default.findAll();
            const users = yield user_model_1.default.findAll();
            const students = yield student_model_1.default.findAll();
            const teachers = yield teacher_model_1.default.findAll();
            const groups = yield group_model_1.default.findAll();
            const unpaidCenters = yield center_model_1.default.findAll({ where: { status: "blocked" } });
            res.status(200).json({
                message: {
                    centers: center.length,
                    users: users.length,
                    students: students.length,
                    teachers: teachers.length,
                    groups: groups.length,
                    unpaidCenters: unpaidCenters.length
                },
            });
        }
        catch (error) {
            next(error);
        }
    });
}
