"use strict";
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
const center_model_1 = __importDefault(require("../Models/center_model"));
const user_model_1 = __importDefault(require("../Models/user_model"));
const teacher_model_1 = __importDefault(require("../Models/teacher_model"));
const group_model_1 = __importDefault(require("../Models/group_model"));
async function getCenters(req, res, next) {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const centers = await center_model_1.default.findAll();
        if (centers.length === 0) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("centers_not_found", { lng: lang })));
        }
        res.status(200).json(centers);
    }
    catch (error) {
        next(error);
    }
}
async function getOneCenter(req, res, next) {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const center = await center_model_1.default.findByPk(req.params.id);
        if (!center) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("center_not_found", { lng: lang })));
        }
        res.status(200).json(center);
    }
    catch (error) {
        next(error);
    }
}
async function createCenter(req, res, next) {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const { name, address, owner, phone, login, password, paymentDate, status, } = req.body;
        const center = await center_model_1.default.create({
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
}
async function updateCenter(req, res, next) {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const { name, address, owner, phone, login, password, paymentDate, status, } = req.body;
        const center = await center_model_1.default.findByPk(req.params.id);
        if (!center) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("center_not_found", { lng: lang })));
        }
        await center.update({
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
}
async function deleteCenter(req, res, next) {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const center = await center_model_1.default.findByPk(req.params.id);
        if (!center) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("center_not_found", { lng: lang })));
        }
        await center.destroy();
        res.status(200).json({
            message: lang_1.default.t("center_deleted", { lng: lang }),
        });
    }
    catch (error) {
        next(error);
    }
}
async function getStats(req, res, next) {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const center = await center_model_1.default.findAll();
        const users = await user_model_1.default.findAll();
        const students = await student_model_1.default.findAll();
        const teachers = await teacher_model_1.default.findAll();
        const groups = await group_model_1.default.findAll();
        const unpaidCenters = await center_model_1.default.findAll({ where: { status: "blocked" } });
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
}
