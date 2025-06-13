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
exports.getMonthlyStudentStats = void 0;
exports.getStudents = getStudents;
exports.getOneStudent = getOneStudent;
exports.createStudent = createStudent;
exports.updateStudent = updateStudent;
exports.deleteStudent = deleteStudent;
exports.makeAttendance = makeAttendance;
const sequelize_1 = require("sequelize");
const lang_1 = __importDefault(require("../Utils/lang"));
const student_model_1 = __importDefault(require("../Models/student_model"));
const base_error_1 = require("../Utils/base_error");
const user_model_1 = __importDefault(require("../Models/user_model"));
const group_model_1 = __importDefault(require("../Models/group_model"));
const attendance_model_1 = __importDefault(require("../Models/attendance_model"));
const notification_srv_1 = require("../Utils/notification.srv");
function getStudents(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const lang = ((_a = req.headers["accept-language"]) === null || _a === void 0 ? void 0 : _a.split(",")[0]) || "uz";
            const students = yield student_model_1.default.findAll();
            if (students.length === 0) {
                return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("students_not_found", { lng: lang })));
            }
            res.status(200).json(students);
        }
        catch (error) {
            next(error);
        }
    });
}
function getOneStudent(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const lang = ((_a = req.headers["accept-language"]) === null || _a === void 0 ? void 0 : _a.split(",")[0]) || "uz";
            const student = yield student_model_1.default.findByPk(req.params.id);
            if (!student) {
                return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("student_not_found", { lng: lang })));
            }
            res.status(200).json(student);
        }
        catch (error) {
            next(error);
        }
    });
}
function createStudent(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const lang = ((_a = req.headers["accept-language"]) === null || _a === void 0 ? void 0 : _a.split(",")[0]) || "uz";
            const { first_name, last_name, father_name, mother_name, birth_date, phone_number, group_id, teacher_id, paid_for_this_month, parents_phone_number, telegram_user_id, came_in_school, img_url, left_school, } = req.body;
            const student = yield student_model_1.default.create({
                first_name,
                last_name,
                father_name,
                mother_name,
                birth_date,
                phone_number,
                group_id,
                teacher_id,
                paid_for_this_month,
                parents_phone_number,
                telegram_user_id,
                came_in_school,
                img_url,
                left_school,
            });
            const group_name = yield group_model_1.default.findByPk(student.dataValues.group_id);
            yield (0, notification_srv_1.createNotification)(student.dataValues.id, lang_1.default.t("added_to_group", { group_subject: group_name === null || group_name === void 0 ? void 0 : group_name.dataValues.group_subject, lng: lang }));
            res.status(200).json(student);
        }
        catch (error) {
            next(error);
        }
    });
}
function updateStudent(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const lang = ((_a = req.headers["accept-language"]) === null || _a === void 0 ? void 0 : _a.split(",")[0]) || "uz";
            const { first_name, last_name, father_name, mother_name, birth_date, phone_number, group_id, teacher_id, paid_for_this_month, parents_phone_number, telegram_user_id, came_in_school, img_url, left_school, } = req.body;
            const student = yield student_model_1.default.findByPk(req.params.id);
            if (!student) {
                return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("student_not_found", { lng: lang })));
            }
            yield student.update({
                first_name,
                last_name,
                father_name,
                mother_name,
                birth_date,
                phone_number,
                group_id,
                teacher_id,
                paid_for_this_month,
                parents_phone_number,
                telegram_user_id,
                came_in_school,
                img_url,
                left_school,
            });
            res.status(200).json(student);
        }
        catch (error) {
            next(error);
        }
    });
}
function deleteStudent(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const lang = ((_a = req.headers["accept-language"]) === null || _a === void 0 ? void 0 : _a.split(",")[0]) || "uz";
            const student = yield student_model_1.default.findByPk(req.params.id);
            if (!student) {
                return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("student_not_found", { lng: lang })));
            }
            yield (0, notification_srv_1.createNotification)(student.dataValues.id, req.t("removed_from_group", { first_name: student.dataValues.first_name }));
            yield student.destroy();
            res.status(200).json({ message: lang_1.default.t("data_deleted", { lng: lang }) });
        }
        catch (error) {
            next(error);
        }
    });
}
const getMonthlyStudentStats = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const allStudentsByMonth = yield student_model_1.default.findAll({
            attributes: [
                [(0, sequelize_1.fn)("TO_CHAR", (0, sequelize_1.col)("created_at"), "YYYY-MM"), "month"],
                [(0, sequelize_1.fn)("COUNT", (0, sequelize_1.col)("*")), "total_count"],
            ],
            group: [(0, sequelize_1.fn)("TO_CHAR", (0, sequelize_1.col)("created_at"), "YYYY-MM")],
            order: [[(0, sequelize_1.fn)("TO_CHAR", (0, sequelize_1.col)("created_at"), "YYYY-MM"), "ASC"]],
        });
        const totalTeachers = yield user_model_1.default.count();
        const totalGroups = yield group_model_1.default.count();
        const leftStudentsByMonth = yield student_model_1.default.findAll({
            attributes: [
                [sequelize_1.Sequelize.literal(`TO_CHAR("left_school", 'YYYY-MM')`), "month"],
                [sequelize_1.Sequelize.fn("COUNT", "*"), "count"],
            ],
            where: {
                left_school: { [sequelize_1.Op.ne]: null },
            },
            group: ["month"],
            order: [[sequelize_1.Sequelize.literal(`TO_CHAR("left_school", 'YYYY-MM')`), "ASC"]],
        });
        const currentMonth = new Date().toISOString().slice(0, 7);
        const thisMonthStatsOfStudents = yield student_model_1.default.findAll({
            attributes: [
                [(0, sequelize_1.fn)("TO_CHAR", (0, sequelize_1.col)("created_at"), "YYYY-MM"), "month"],
                [(0, sequelize_1.fn)("COUNT", (0, sequelize_1.col)("*")), "total_students"],
                [
                    sequelize_1.Sequelize.literal(`
        (SELECT COUNT(*) FROM "Students" s 
         WHERE TO_CHAR(s."created_at", 'YYYY-MM') <= '${currentMonth}'
         AND (s."left_school" IS NULL OR TO_CHAR(s."left_school", 'YYYY-MM') > '${currentMonth}')
        )
      `),
                    "current_month_students",
                ],
                [
                    sequelize_1.Sequelize.literal(`
        (SELECT COUNT(*) FROM "Students" s 
         WHERE TO_CHAR(s."left_school", 'YYYY-MM') = '${currentMonth}')
      `),
                    "left_students_this_month",
                ],
            ],
            group: [(0, sequelize_1.fn)("TO_CHAR", (0, sequelize_1.col)("created_at"), "YYYY-MM")],
            order: [[(0, sequelize_1.fn)("TO_CHAR", (0, sequelize_1.col)("created_at"), "YYYY-MM"), "ASC"]],
        });
        return res.status(200).json({
            totalTeachers,
            totalGroups,
            allStudentsByMonth,
            leftStudentsByMonth,
            thisMonthStatsOfStudents,
        });
    }
    catch (error) {
        const lang = ((_a = req.headers["accept-language"]) === null || _a === void 0 ? void 0 : _a.split(",")[0]) || "uz";
        next(error);
        return res.status(500).json({ message: lang_1.default.t("server_error", { lng: lang }) });
    }
});
exports.getMonthlyStudentStats = getMonthlyStudentStats;
function makeAttendance(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const lang = ((_a = req.headers["accept-language"]) === null || _a === void 0 ? void 0 : _a.split(",")[0]) || "uz";
            let group_subject_id = req.params.id;
            let { attendanceBody } = req.body;
            const date = new Date(2025, 2, 1);
            const formattedDate = date.toLocaleDateString(`uz-UZ`, {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
            let foundGroup = yield group_model_1.default.findByPk(group_subject_id);
            if (!foundGroup) {
                return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("group_not_found", { lng: lang })));
            }
            const attendance_res = [];
            let startTime = foundGroup.dataValues.start_time;
            let endTime = foundGroup.dataValues.end_time;
            let now = new Date();
            let timeNow = now.toTimeString().split(" ")[0];
            if (timeNow > endTime || timeNow < startTime) {
                return next(base_error_1.BaseError.BadRequest(400, lang_1.default.t("class_not_available", { lng: lang })));
            }
            for (const item of attendanceBody) {
                const foundStudent = yield student_model_1.default.findByPk(item.studentId);
                if (!foundStudent) {
                    return next(base_error_1.BaseError.BadRequest(400, req.t("student_id_not_found", { studentId: item.studentId })));
                }
                if (item.present) {
                    foundStudent.update({ came_in_school: new Date().toISOString() });
                    attendance_res.push({ student_id: item.studentId, attendance: "came" });
                }
                else {
                    attendance_res.push({ student_id: item.studentId, attendance: "not" });
                    yield (0, notification_srv_1.createNotification)(item.studentId, req.t("absent_notification", {
                        date: formattedDate,
                        startTime: startTime.slice(0, 5),
                        endTime: endTime.slice(0, 5),
                        lng: lang,
                        interpolation: { escapeValue: false },
                    }));
                }
            }
            const attend = yield attendance_model_1.default.create({
                group_id: group_subject_id,
                came_students: attendance_res,
            });
            res.status(201).json(attend);
        }
        catch (error) {
            next(error);
        }
    });
}
