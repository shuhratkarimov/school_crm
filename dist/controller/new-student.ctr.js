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
        const { first_name, last_name, father_name, birth_date, phone, parents_phone_number, came_in_school, } = req.body;
        if (!first_name?.trim() || !last_name?.trim() || !phone?.trim()) {
            return next(base_error_1.BaseError.BadRequest(400, "Ism, familiya va telefon majburiy"));
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
            father_name: father_name?.trim() || null,
            birth_date: birth_date || null,
            phone,
            parents_phone_number: parents_phone_number?.trim() || null,
            came_in_school: came_in_school || null,
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
        const updates = {};
        const allowed = [
            "interviewed",
            "approved",
            "first_name",
            "last_name",
            "father_name",
            "birth_date",
            "phone",
            "parents_phone_number",
            "came_in_school",
        ];
        for (const key of allowed) {
            if (req.body[key] !== undefined)
                updates[key] = req.body[key];
        }
        const student = await newstudent_model_1.default.findOne({
            where: (0, branch_scope_helper_1.withBranchScope)(req, { id }),
        });
        if (!student) {
            return next(base_error_1.BaseError.BadRequest(404, "Yangi o`quvchi topilmadi (yoki ruxsat yo‘q)"));
        }
        await student.update(updates);
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
