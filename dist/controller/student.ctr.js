"use strict";
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
exports.getOneGroupStudents = getOneGroupStudents;
const sequelize_1 = require("sequelize");
const lang_1 = __importDefault(require("../Utils/lang"));
const index_1 = require("../Models/index");
const base_error_1 = require("../Utils/base_error");
const index_2 = require("../Models/index");
const index_3 = require("../Models/index");
const attendance_model_1 = __importDefault(require("../Models/attendance_model"));
const notification_srv_1 = require("../Utils/notification.srv");
const payments_ctr_1 = require("./payments.ctr");
const database_config_1 = __importDefault(require("../config/database.config"));
const sms_service_1 = require("../Utils/sms-service");
async function generateStudentId(transaction) {
    try {
        const lastStudent = await index_1.Student.findOne({
            order: [[sequelize_1.Sequelize.literal("CAST(studental_id AS INTEGER)"), "DESC"]],
            attributes: ["studental_id"],
            transaction,
        });
        let newIdNumber = 1;
        if (lastStudent && lastStudent.dataValues.studental_id) {
            const lastId = lastStudent.dataValues.studental_id;
            const parsedId = parseInt(lastId, 10);
            if (!isNaN(parsedId)) {
                newIdNumber = parsedId + 1;
            }
            else {
                console.warn(`Noto'g'ri studental_id formati: ${lastId}`);
            }
        }
        const newId = newIdNumber.toString().padStart(3, "0");
        const existingStudent = await index_1.Student.findOne({
            where: { studental_id: newId },
            transaction,
        });
        if (existingStudent) {
            throw new Error(`ID ${newId} allaqachon mavjud!`);
        }
        return newId;
    }
    catch (error) {
        console.error("ID yaratishda xato:", error);
        throw new Error("Talaba ID-sini yaratib bo‘lmadi");
    }
}
async function getStudents(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const students = await index_1.Student.findAll({
            include: [
                {
                    model: index_3.Group,
                    as: "group",
                    attributes: ["id", "group_subject"],
                },
            ],
        });
        if (students.length === 0) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("students_not_found", { lng: lang })));
        }
        res.status(200).json(students);
    }
    catch (error) {
        next(error);
    }
}
async function getOneStudent(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const student = await index_1.Student.findByPk(req.params.id);
        if (!student) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("student_not_found", { lng: lang })));
        }
        res.status(200).json(student);
    }
    catch (error) {
        next(error);
    }
}
async function getOneGroupStudents(req, res, next) {
    try {
        const lang = "uz";
        const groupId = req.query.group_id;
        if (!groupId)
            return res.status(400).json({ error: "group_id required" });
        const students = await index_1.Student.findAll({ where: { group_id: groupId } });
        if (students.length === 0) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("student_not_found", { lng: lang })));
        }
        res.status(200).json(students);
    }
    catch (error) {
        next(error);
    }
}
async function createStudent(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const { first_name, last_name, father_name, mother_name, birth_date, phone_number, group_id, teacher_id, paid_for_this_month, parents_phone_number, telegram_user_id, came_in_school, img_url, left_school, } = req.body;
        if (!group_id) {
            return next(base_error_1.BaseError.BadRequest(400, lang_1.default.t("group_id_required", { lng: lang })));
        }
        const t = await database_config_1.default.transaction();
        try {
            const ReturnedId = await generateStudentId(t);
            console.log("newId in createStudent:", ReturnedId);
            const student = await index_1.Student.create({
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
                studental_id: ReturnedId,
            }, { transaction: t });
            const group_name = await index_3.Group.findByPk(student.dataValues.group_id, {
                transaction: t,
            });
            if (!group_name) {
                throw base_error_1.BaseError.BadRequest(404, lang_1.default.t("group_not_found", { lng: lang }));
            }
            await group_name.increment("students_amount", { by: 1, transaction: t });
            await (0, notification_srv_1.createNotification)(student.dataValues.id, lang_1.default.t("added_to_group", {
                group_subject: group_name.dataValues.group_subject,
                lng: lang,
            }), { transaction: t });
            await t.commit();
            const welcomeMessage = `Assalomu alaykum hurmatli ${student.dataValues.first_name} ${student.dataValues.last_name}!\nSizni o'quvchilarimiz orasida ko'rib turganimizdan juda xursandmiz!\nSizning shaxsiy ID raqamingiz: ID${student.dataValues.studental_id}\nSiz shaxsiy ID raqamingizdan foydalangan holda markazimizning @murojaat_crm_bot telegram boti orqali bizga istalgan vaqtda murojaat qilishingiz mumkin.\nO'qishlaringizda muvaffaqiyatlar tilaymiz!\n\nHurmat bilan,\n"Intellectual Progress Star" jamoasi! `;
            await (0, sms_service_1.sendSMS)(student.dataValues.id, student.dataValues.phone_number, welcomeMessage);
            res.status(200).json(student);
        }
        catch (error) {
            await t.rollback();
            throw error;
        }
    }
    catch (error) {
        console.error("Error in createStudent:", error);
        next(error);
    }
}
async function updateStudent(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const { first_name, last_name, father_name, mother_name, birth_date, phone_number, group_id, teacher_id, paid_for_this_month, parents_phone_number, telegram_user_id, came_in_school, img_url, left_school, } = req.body;
        const student = await index_1.Student.findByPk(req.params.id);
        if (!student) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("student_not_found", { lng: lang })));
        }
        await student.update({
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
}
async function deleteStudent(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const t = await database_config_1.default.transaction();
        try {
            const student = await index_1.Student.findByPk(req.params.id, {
                transaction: t,
            });
            if (!student) {
                throw base_error_1.BaseError.BadRequest(404, lang_1.default.t("student_not_found", { lng: lang }));
            }
            const group_name = await index_3.Group.findByPk(student.dataValues.group_id, {
                transaction: t,
            });
            if (!group_name) {
                throw base_error_1.BaseError.BadRequest(404, lang_1.default.t("group_not_found", { lng: lang }));
            }
            await group_name.increment("students_amount", { by: -1, transaction: t });
            await (0, notification_srv_1.createNotification)(student.dataValues.id, lang_1.default.t("removed_from_group", {
                first_name: student.dataValues.first_name,
                lng: lang,
            }), { transaction: t });
            await student.destroy({ transaction: t });
            await t.commit();
            res
                .status(200)
                .json({ message: lang_1.default.t("data_deleted", { lng: lang }) });
        }
        catch (error) {
            await t.rollback();
            throw error;
        }
    }
    catch (error) {
        console.error("Error in deleteStudent:", error);
        next(error);
    }
}
const getMonthlyStudentStats = async (req, res, next) => {
    try {
        const allStudentsByMonth = await index_1.Student.findAll({
            attributes: [
                [(0, sequelize_1.fn)("TO_CHAR", (0, sequelize_1.col)("created_at"), "YYYY-MM"), "month"],
                [(0, sequelize_1.fn)("COUNT", (0, sequelize_1.col)("*")), "total_count"],
            ],
            group: [(0, sequelize_1.fn)("TO_CHAR", (0, sequelize_1.col)("created_at"), "YYYY-MM")],
            order: [[(0, sequelize_1.fn)("TO_CHAR", (0, sequelize_1.col)("created_at"), "YYYY-MM"), "ASC"]],
        });
        const totalTeachers = await index_2.Teacher.count();
        const totalGroups = await index_3.Group.count();
        const leftStudentsByMonth = await index_1.Student.findAll({
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
        const thisMonthStatsOfStudents = await index_1.Student.findAll({
            attributes: [
                [(0, sequelize_1.fn)("TO_CHAR", (0, sequelize_1.col)("created_at"), "YYYY-MM"), "month"],
                [(0, sequelize_1.fn)("COUNT", (0, sequelize_1.col)("*")), "total_students"],
                [
                    sequelize_1.Sequelize.literal(`
            (SELECT COUNT(*) FROM "students" s 
             WHERE TO_CHAR(s."created_at", 'YYYY-MM') <= '${currentMonth}'
             AND (s."left_school" IS NULL OR TO_CHAR(s."left_school", 'YYYY-MM') > '${currentMonth}')
            )
          `),
                    "current_month_students",
                ],
                [
                    sequelize_1.Sequelize.literal(`
            (SELECT COUNT(*) FROM "students" s 
             WHERE TO_CHAR(s."left_school", 'YYYY-MM') = '${currentMonth}')
          `),
                    "left_students_this_month",
                ],
            ],
            group: [(0, sequelize_1.fn)("TO_CHAR", (0, sequelize_1.col)("created_at"), "YYYY-MM")],
            order: [[(0, sequelize_1.fn)("TO_CHAR", (0, sequelize_1.col)("created_at"), "YYYY-MM"), "ASC"]],
        });
        const latestStudents = await index_1.Student.findAll({
            order: [["created_at", "DESC"]],
            limit: 10,
            include: [
                {
                    model: index_3.Group,
                    as: "group",
                    attributes: ["id", "group_subject"],
                },
                {
                    model: index_2.Teacher,
                    as: "teacher",
                    attributes: ["id", "first_name", "last_name"],
                },
            ],
        });
        const totalStudents = await index_1.Student.findAndCountAll();
        const totalPaymentThisMonth = await (0, payments_ctr_1.getThisMonthTotalPayments)();
        const latestPaymentsForThisMonth = await (0, payments_ctr_1.latestPayments)();
        return res.status(200).json({
            totalTeachers,
            totalGroups,
            allStudentsByMonth,
            leftStudentsByMonth,
            thisMonthStatsOfStudents,
            totalPaymentThisMonth,
            latestStudents,
            latestPaymentsForThisMonth,
            totalStudents,
        });
    }
    catch (error) {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        next(error);
    }
};
exports.getMonthlyStudentStats = getMonthlyStudentStats;
async function makeAttendance(req, res, next) {
    try {
        const lang = "uz";
        let group_subject_id = req.params.id;
        let { attendanceBody } = req.body;
        const date = new Date(2025, 2, 1);
        const formattedDate = date.toLocaleDateString(`uz-UZ`, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
        let foundGroup = await index_3.Group.findByPk(group_subject_id);
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
            const foundStudent = await index_1.Student.findByPk(item.studentId);
            if (!foundStudent) {
                return next(base_error_1.BaseError.BadRequest(400, req.t("student_id_not_found", { studentId: item.studentId })));
            }
            if (item.present) {
                foundStudent.update({ came_in_school: new Date().toISOString() });
                attendance_res.push({ student_id: item.studentId, attendance: "came" });
            }
            else {
                attendance_res.push({ student_id: item.studentId, attendance: "not" });
                // await createNotification(
                //   item.studentId,
                //   req.t("absent_notification", {
                //     date: formattedDate,
                //     startTime: startTime.slice(0, 5),
                //     endTime: endTime.slice(0, 5),
                //     lng: lang,
                //     interpolation: { escapeValue: false },
                //   })
                // );
            }
        }
        const attend = await attendance_model_1.default.create({
            group_id: group_subject_id,
            came_students: attendance_res,
        });
        res.status(201).json(attend);
    }
    catch (error) {
        next(error);
    }
}
