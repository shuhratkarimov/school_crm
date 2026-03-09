"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTestResultsToParents = void 0;
exports.getTeacherTests = getTeacherTests;
exports.getTestResultsByAdmin = getTestResultsByAdmin;
exports.getTestResults = getTestResults;
exports.createTest = createTest;
exports.updateTest = updateTest;
exports.deleteTest = deleteTest;
exports.getAllTestsByMonthAndYear = getAllTestsByMonthAndYear;
const sequelize_1 = require("sequelize");
const base_error_1 = require("../Utils/base_error");
const index_1 = require("../Models/index");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sms_service_1 = require("../Utils/sms-service");
const branch_scope_helper_1 = require("../Utils/branch_scope.helper");
async function getTeacherTests(req, res, next) {
    try {
        const teacherId = req.teacher.id;
        const { month, year } = req.query;
        if (!month || !year)
            return next(base_error_1.BaseError.BadRequest(400, "Yil va oy kerak"));
        const tests = await index_1.Test.findAll({
            where: {
                teacher_id: teacherId,
                created_at: {
                    [sequelize_1.Op.gte]: new Date(Number(year), Number(month) - 1, 1),
                    [sequelize_1.Op.lt]: new Date(Number(year), Number(month), 1),
                },
            },
            include: [{ model: index_1.Group, as: "group" }],
            order: [["created_at", "DESC"]],
        });
        res.json(tests);
    }
    catch (err) {
        next(err);
    }
}
async function getTestResults(req, res, next) {
    try {
        const teacherId = req.teacher.id;
        const { test_id } = req.params;
        const test = await index_1.Test.findOne({
            where: { id: test_id, teacher_id: teacherId }, // ✅ ownership
            include: [
                { model: index_1.Group, as: "group" },
                {
                    model: index_1.TestResult,
                    as: "results",
                    include: [{ model: index_1.Student, as: "student" }],
                },
            ],
        });
        if (!test)
            return next(base_error_1.BaseError.BadRequest(404, "Test topilmadi"));
        res.json(test);
    }
    catch (err) {
        next(err);
    }
}
async function getTestResultsByAdmin(req, res, next) {
    try {
        const { test_id } = req.params;
        const test = await index_1.Test.findOne({
            where: { id: test_id }, // ✅ Testda faqat id
            include: [
                {
                    model: index_1.Group,
                    as: "group",
                    required: true,
                    where: (0, branch_scope_helper_1.withBranchScope)(req, {}, "branch_id"), // ✅ Group.branch_id bo'yicha filter
                },
                {
                    model: index_1.TestResult,
                    as: "results",
                    include: [{ model: index_1.Student, as: "student" }],
                },
            ],
        });
        if (!test)
            return next(base_error_1.BaseError.BadRequest(404, "Test topilmadi"));
        res.json(test);
    }
    catch (err) {
        next(err);
    }
}
async function getAllTestsByMonthAndYear(req, res, next) {
    try {
        const { month, year } = req.query;
        if (!month || !year)
            return next(base_error_1.BaseError.BadRequest(400, "Yil va oy kerak"));
        const start = new Date(Number(year), Number(month) - 1, 1);
        const end = new Date(Number(year), Number(month), 1);
        const tests = await index_1.Test.findAll({
            where: {
                created_at: { [sequelize_1.Op.gte]: start, [sequelize_1.Op.lt]: end },
            },
            include: [{
                    model: index_1.Group,
                    as: "group",
                    required: true,
                    // ✅ branch filter group orqali
                    where: (0, branch_scope_helper_1.withBranchScope)(req, {}, "branch_id"),
                }],
            order: [["created_at", "DESC"]],
        });
        res.json(tests);
    }
    catch (err) {
        next(err);
    }
}
async function createTest(req, res, next) {
    try {
        const teacherId = req.teacher.id;
        const { group_id, test_number, test_type, total_students, attended_students, average_score, results, date } = req.body;
        if (!group_id || !test_number || !test_type || !results || !date) {
            return next(base_error_1.BaseError.BadRequest(400, "Barcha maydonlar to'ldirilishi kerak"));
        }
        // ✅ Teacher faqat o'z guruhiga test qo'shsin
        const group = await index_1.Group.findOne({ where: { id: group_id, teacher_id: teacherId } });
        if (!group)
            return next(base_error_1.BaseError.BadRequest(403, "Bu guruh sizga tegishli emas"));
        const test = await index_1.Test.create({
            group_id,
            teacher_id: teacherId,
            test_number,
            test_type,
            total_students,
            attended_students,
            average_score,
            date,
        });
        const testResults = results.map((r) => ({
            test_id: test.id,
            student_id: r.student_id,
            score: r.score,
            attended: r.attended,
        }));
        await index_1.TestResult.bulkCreate(testResults);
        res.status(201).json({ message: "Test saqlandi", test });
    }
    catch (err) {
        next(err);
    }
}
async function updateTest(req, res, next) {
    try {
        const accesstoken = req.cookies.accesstoken;
        if (!accesstoken)
            return next(base_error_1.BaseError.BadRequest(400, "Token topilmadi"));
        const decoded = jsonwebtoken_1.default.verify(accesstoken, process.env.ACCESS_SECRET_KEY);
        const teacherId = decoded.id;
        const { test_id } = req.params;
        const { group_id, test_number, test_type, total_students, attended_students, average_score, results, date, editTimeLimit, is_sent } = req.body;
        const test = await index_1.Test.findOne({ where: { id: test_id, teacher_id: teacherId } });
        if (!test)
            return next(base_error_1.BaseError.BadRequest(404, "Test topilmadi"));
        const now = new Date();
        if (!test.dataValues.created_at)
            return next(base_error_1.BaseError.BadRequest(400, "Test yaratilgan vaqt topilmadi"));
        const created = new Date(test.dataValues.created_at);
        const diff = now.getTime() - created.getTime();
        if (diff > editTimeLimit * 3600 * 1000) {
            return next(base_error_1.BaseError.BadRequest(403, `Testni tahrirlash uchun ${editTimeLimit} soat o'tgan`));
        }
        await test.update({
            group_id,
            teacher_id: teacherId,
            test_number,
            test_type,
            total_students,
            attended_students,
            average_score,
            date,
        });
        await index_1.TestResult.destroy({ where: { test_id } });
        const testResults = results.map((result) => ({
            test_id,
            student_id: result.student_id, // UUID
            score: result.score,
            attended: result.attended,
        }));
        await index_1.TestResult.bulkCreate(testResults);
        res.json({ message: "Test tahrirlandi" });
    }
    catch (err) {
        return next(err);
    }
}
async function deleteTest(req, res, next) {
    try {
        const teacherId = req.teacher.id;
        const { test_id } = req.params;
        const test = await index_1.Test.findOne({ where: { id: test_id, teacher_id: teacherId } });
        if (!test)
            return next(base_error_1.BaseError.BadRequest(404, "Test topilmadi"));
        await test.destroy();
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
}
async function getStudentsByTest(testId) {
    const test = await index_1.Test.findByPk(testId);
    if (!test)
        throw new Error("Test topilmadi");
    const studentsDatas = await index_1.StudentGroup.findAll({
        where: { group_id: test.group_id },
    });
    const studentIds = studentsDatas.map(s => s.dataValues.student_id);
    return await index_1.Student.findAll({
        where: { id: studentIds },
        attributes: ["id", "parents_phone_number"],
    });
}
const sendTestResultsToParents = async (req, res, next) => {
    try {
        const { test_id } = req.params;
        const test = await index_1.Test.findByPk(test_id);
        if (!test)
            return next(base_error_1.BaseError.BadRequest(404, "Test topilmadi"));
        const students = await getStudentsByTest(test_id);
        if (!students?.length)
            return next(base_error_1.BaseError.BadRequest(404, "O‘quvchilar topilmadi"));
        const results = await index_1.TestResult.findAll({
            where: { test_id },
            include: [{ model: index_1.Student, as: "student" }]
        });
        const isSmsSent = results.every(result => result.is_sent);
        if (isSmsSent)
            return next(base_error_1.BaseError.BadRequest(400, "Ushbu test uchun SMSlar allaqachon yuborilgan"));
        for (const result of results) {
            const message = result.attended ? `Hurmatli ${result.student.father_name ? result.student.father_name : 'ota-ona!'}, Farzandingiz ${result.student.last_name} ${result.student.first_name} markaz tomonidan o'tkazilgan testda ${result.score} ball olganligini ma'lum qilamiz\nHurmat bilan Intellectual Progress o'quv markazi jamoasi.` : `Hurmatli ${result.student.father_name ? result.student.father_name : 'ota-ona!'}, Farzandingiz ${result.student.last_name} ${result.student.first_name} markaz tomonidan o'tkazilgan testda qatnashmaganligini ma'lum qilamiz\nHurmat bilan Intellectual Progress o'quv markazi jamoasi.`;
            await (0, sms_service_1.sendSMS)(result.student.id, result.student.parents_phone_number, message);
            result.is_sent = true;
            await result.save();
        }
        return res.json({ message: "SMSlar yuborildi" });
    }
    catch (err) {
        return next(err);
    }
};
exports.sendTestResultsToParents = sendTestResultsToParents;
