"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNewStudents = getNewStudents;
exports.registerNewStudentPublic = registerNewStudentPublic;
exports.updateNewStudent = updateNewStudent;
exports.deleteNewStudent = deleteNewStudent;
const newstudent_model_1 = __importDefault(require("../Models/newstudent_model"));
const base_error_1 = require("../Utils/base_error");
const registration_link_model_1 = require("../Models/registration_link_model");
const branch_scope_helper_1 = require("../Utils/branch_scope.helper");
async function getNewStudents(req, res, next) {
    try {
        const students = await newstudent_model_1.default.findAll({
            where: (0, branch_scope_helper_1.withBranchScope)(req),
            order: [["created_at", "DESC"]],
        });
        res.json(students);
    }
    catch (error) {
        next(error);
    }
}
async function registerNewStudentPublic(req, res, next) {
    try {
        const { token } = req.params;
        const { first_name, last_name, phone } = req.body;
        if (!first_name?.trim() || !last_name?.trim() || !phone?.trim()) {
            return next(base_error_1.BaseError.BadRequest(400, "Barcha maydonlar kiritilishi shart"));
        }
        const link = await registration_link_model_1.RegistrationLink.findOne({
            where: { token },
            attributes: ["subject", "branch_id"],
        });
        if (!link)
            return next(base_error_1.BaseError.BadRequest(404, "Link topilmadi"));
        const student = await newstudent_model_1.default.create({
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            phone,
            subject: link.get("subject"),
            branch_id: link.get("branch_id"),
        });
        return res.status(201).json(student);
    }
    catch (e) {
        next(e);
    }
}
async function updateNewStudent(req, res, next) {
    try {
        const { id } = req.params;
        const { interviewed } = req.body;
        const student = await newstudent_model_1.default.findOne({
            where: (0, branch_scope_helper_1.withBranchScope)(req, { id }),
        });
        if (!student) {
            return next(base_error_1.BaseError.BadRequest(404, "Yangi o`quvchi topilmadi (yoki ruxsat yo‘q)"));
        }
        await student.update({ interviewed });
        res.json(student);
    }
    catch (error) {
        next(error);
    }
}
async function deleteNewStudent(req, res, next) {
    try {
        const { id } = req.params;
        const student = await newstudent_model_1.default.findOne({
            where: (0, branch_scope_helper_1.withBranchScope)(req, { id }),
        });
        if (!student) {
            return next(base_error_1.BaseError.BadRequest(404, "Yangi o`quvchi topilmadi (yoki ruxsat yo‘q)"));
        }
        await student.destroy();
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
}
