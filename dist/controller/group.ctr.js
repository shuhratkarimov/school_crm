"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReserveStudent = exports.deleteReserveStudent = exports.updateReserveStudent = exports.getReserveStudents = exports.importStudents = void 0;
exports.getGroups = getGroups;
exports.getOneGroup = getOneGroup;
exports.createGroup = createGroup;
exports.updateGroup = updateGroup;
exports.deleteGroup = deleteGroup;
exports.getOneTeacherGroup = getOneTeacherGroup;
exports.getOneGroupForTeacherAttendance = getOneGroupForTeacherAttendance;
exports.approveReserveStudent = approveReserveStudent;
const base_error_1 = require("../Utils/base_error");
const lang_1 = __importDefault(require("../Utils/lang"));
const index_1 = require("../Models/index");
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const student_groups_model_1 = __importDefault(require("../Models/student_groups_model"));
const database_config_1 = __importDefault(require("../config/database.config"));
const reserve_student_model_1 = require("../Models/reserve_student_model");
const student_ctr_1 = require("./student.ctr");
const branch_scope_helper_1 = require("../Utils/branch_scope.helper");
async function approveReserveStudent(req, res, next) {
    const { id } = req.params;
    const { group_ids = [] } = req.body;
    try {
        const reserve = await reserve_student_model_1.ReserveStudent.findOne({
            where: (0, branch_scope_helper_1.withBranchScope)(req, { id }),
        });
        if (!reserve) {
            return next(base_error_1.BaseError.BadRequest(404, "Zaxiradagi o'quvchi topilmadi (yoki ruxsat yo'q)"));
        }
        const ReturnedId = await (0, student_ctr_1.generateStudentId)();
        await database_config_1.default.transaction(async (t) => {
            let safeGroupIds = [];
            if (group_ids.length > 0) {
                const allowedGroups = await index_1.Group.findAll({
                    where: (0, branch_scope_helper_1.withBranchScope)(req, { id: { [sequelize_1.Op.in]: group_ids } }),
                    attributes: ["id", "group_subject"],
                    transaction: t,
                });
                const allowedIds = new Set(allowedGroups.map((g) => String(g.get("id"))));
                safeGroupIds = group_ids.filter((gid) => allowedIds.has(String(gid)));
                if (safeGroupIds.length !== group_ids.length) {
                    throw base_error_1.BaseError.BadRequest(403, "Group ro'yxatida ruxsatsiz guruh bor");
                }
            }
            const newStudent = await index_1.Student.create({
                first_name: reserve.dataValues.first_name,
                last_name: reserve.dataValues.last_name,
                father_name: reserve.dataValues.father_name,
                mother_name: reserve.dataValues.mother_name,
                birth_date: reserve.dataValues.birth_date,
                phone_number: reserve.dataValues.phone_number,
                parents_phone_number: reserve.dataValues.parents_phone_number,
                came_in_school: reserve.dataValues.came_in_school,
                studental_id: ReturnedId,
                branch_id: reserve.dataValues.branch_id,
                total_groups: safeGroupIds.length,
                paid_groups: 0,
            }, { transaction: t });
            if (safeGroupIds.length > 0) {
                const currentYear = new Date().getFullYear();
                const currentMonthIndex = new Date().getMonth() + 1;
                const monthsToCreate = [];
                for (let m = currentMonthIndex; m <= 12; m++) {
                    monthsToCreate.push(student_ctr_1.monthsInUzbek[m]);
                }
                for (const gid of safeGroupIds) {
                    for (const month of monthsToCreate) {
                        await student_groups_model_1.default.findOrCreate({
                            where: {
                                student_id: newStudent.dataValues.id,
                                group_id: gid,
                                month,
                                year: currentYear,
                            },
                            defaults: {
                                paid: false,
                            },
                            transaction: t,
                        });
                    }
                    const group = await index_1.Group.findOne({
                        where: (0, branch_scope_helper_1.withBranchScope)(req, { id: gid }),
                        transaction: t,
                    });
                    if (group) {
                        await group.increment("students_amount", { by: 1, transaction: t });
                    }
                }
            }
            await reserve.destroy({ transaction: t });
            await (0, student_ctr_1.updateStudentPaymentStatus)(newStudent.dataValues.id);
        });
        return res.status(200).json({
            success: true,
            message: "O'quvchi students jadvaliga o'tkazildi va guruh(lar)ga biriktirildi",
        });
    }
    catch (err) {
        next(err);
    }
}
const createReserveStudent = async (req, res, next) => {
    try {
        const scope = req.scope;
        const branch_id = scope?.all ? req.body.branch_id : scope.branchIds?.[0];
        if (!branch_id)
            return next(base_error_1.BaseError.BadRequest(400, "branch_id required"));
        const { first_name, last_name, father_name, mother_name, birth_date, phone_number, parents_phone_number, came_in_school, notes, } = req.body;
        // Majburiy maydonlarni tekshirish
        if (!first_name?.trim() || !last_name?.trim() || !phone_number || !parents_phone_number) {
            return next(base_error_1.BaseError.BadRequest(400, "Majburiy maydonlar to'ldirilmagan (ism, familiya, telefonlar)"));
        }
        const newStudent = await reserve_student_model_1.ReserveStudent.create({
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            father_name: father_name?.trim(),
            mother_name: mother_name?.trim(),
            birth_date: birth_date ? new Date(birth_date) : null,
            phone_number,
            parents_phone_number,
            came_in_school: came_in_school ? new Date(came_in_school) : null,
            notes: notes?.trim(),
            status: "new",
            created_at: new Date(),
            branch_id
        });
        res.status(201).json({
            message: "Yangi o'quvchi zaxiraga qo'shildi",
            student: newStudent,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createReserveStudent = createReserveStudent;
const importStudents = async (req, res, next) => {
    try {
        if (!req.body || !req.body.students) {
            return next(base_error_1.BaseError.BadRequest(400, "students maydoni majburiy"));
        }
        if (!Array.isArray(req.body.students)) {
            return next(base_error_1.BaseError.BadRequest(400, "students massiv bo'lishi kerak"));
        }
        const students = req.body.students;
        const created = [];
        await database_config_1.default.transaction(async (t) => {
            for (const data of students) {
                // Telefon unique tekshirish
                const existing = await Promise.all([
                    reserve_student_model_1.ReserveStudent.findOne({ where: { phone_number: data.phone_number }, transaction: t }),
                    index_1.Student.findOne({ where: { phone_number: data.phone_number }, transaction: t }),
                ]);
                const reserveStudent = await reserve_student_model_1.ReserveStudent.create({
                    first_name: data.first_name,
                    last_name: data.last_name,
                    father_name: data.father_name,
                    mother_name: data.mother_name,
                    birth_date: data.birth_date ? new Date(data.birth_date) : null,
                    phone_number: data.phone_number,
                    parents_phone_number: data.parents_phone_number,
                    came_in_school: data.came_in_school ? new Date(data.came_in_school) : null,
                    status: 'new',
                }, { transaction: t });
                created.push(reserveStudent);
            }
        });
        res.status(201).json({
            message: `${created.length} ta o'quvchi zaxiraga qo'shildi`,
            count: created.length,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.importStudents = importStudents;
const getReserveStudents = async (req, res, next) => {
    try {
        const students = await reserve_student_model_1.ReserveStudent.findAll({
            where: (0, branch_scope_helper_1.withBranchScope)(req),
            order: [["created_at", "DESC"]],
        });
        res.status(200).json(students);
    }
    catch (err) {
        next(err);
    }
};
exports.getReserveStudents = getReserveStudents;
const updateReserveStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const student = await reserve_student_model_1.ReserveStudent.findOne({
            where: (0, branch_scope_helper_1.withBranchScope)(req, { id }),
        });
        if (!student)
            return next(base_error_1.BaseError.BadRequest(404, "Topilmadi (yoki ruxsat yo'q)"));
        // Agar telefon o'zgartirilsa, unique tekshirish
        if (data.phone_number && data.phone_number !== student.dataValues.phone_number) {
            const existing = await reserve_student_model_1.ReserveStudent.findOne({ where: { phone_number: data.phone_number } });
            if (existing) {
                return next(base_error_1.BaseError.BadRequest(409, `Telefon allaqachon mavjud: ${data.phone_number}`));
            }
        }
        await student.update({
            ...data,
            birth_date: data.birth_date ? new Date(data.birth_date) : student.dataValues.birth_date,
            came_in_school: data.came_in_school ? new Date(data.came_in_school) : student.dataValues.came_in_school,
        });
        res.status(200).json({
            message: "Ma'lumotlar yangilandi",
            student,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateReserveStudent = updateReserveStudent;
const deleteReserveStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const student = await reserve_student_model_1.ReserveStudent.findOne({
            where: (0, branch_scope_helper_1.withBranchScope)(req, { id }),
        });
        if (!student)
            return next(base_error_1.BaseError.BadRequest(404, "Topilmadi (yoki ruxsat yo'q)"));
        await student.destroy();
        res.status(200).json({ message: "O'quvchi zaxiradan o'chirildi" });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteReserveStudent = deleteReserveStudent;
async function getGroups(req, res, next) {
    try {
        const lang = "uz";
        const groups = await index_1.Group.findAll({
            where: (0, branch_scope_helper_1.withBranchScope)(req),
            include: [
                {
                    model: index_1.Teacher,
                    as: "teacher",
                    attributes: [
                        "id",
                        "first_name",
                        "last_name",
                        "phone_number",
                        "subject",
                    ],
                },
                {
                    model: index_1.Schedule,
                    as: "groupSchedules", // Yangi alias
                    include: [{ model: index_1.Room, as: "room", attributes: ["id", "name"] }],
                },
                {
                    model: index_1.Room,
                    as: "room",
                    attributes: ["id", "name", "capacity"],
                },
            ],
        });
        if (groups.length === 0) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("groups_not_found", { lng: lang })));
        }
        res.json(groups);
    }
    catch (error) {
        next(error);
    }
}
async function getOneTeacherGroup(req, res, next) {
    try {
        const groupId = req.params.id;
        const lang = "uz";
        const group = await index_1.Group.findByPk(groupId, {
            include: [
                {
                    model: index_1.Teacher,
                    as: "teacher",
                    attributes: [
                        "id",
                        "first_name",
                        "last_name",
                        "phone_number",
                        "subject",
                    ],
                },
                {
                    model: index_1.Schedule,
                    as: "groupSchedules", // Yangi alias
                    include: [{ model: index_1.Room, as: "room", attributes: ["id", "name"] }],
                },
            ],
        });
        if (!group)
            return next(base_error_1.BaseError.BadRequest(404, "Guruh topilmadi (yoki ruxsat yo'q)"));
        const studentsInThisGroup = await index_1.Student.findAll({
            include: [{
                    model: student_groups_model_1.default,
                    as: "studentGroups",
                    where: { group_id: group.dataValues.id },
                    attributes: [],
                }],
        });
        res.status(200).json({ group, studentsInThisGroup });
    }
    catch (error) {
        next(error);
    }
}
async function getOneGroup(req, res, next) {
    try {
        const lang = "uz";
        const group = await index_1.Group.findOne({
            where: (0, branch_scope_helper_1.withBranchScope)(req, { id: req.params.id }),
            include: [
                {
                    model: index_1.Teacher,
                    as: "teacher",
                    attributes: [
                        "id",
                        "first_name",
                        "last_name",
                        "phone_number",
                        "subject",
                    ],
                },
                {
                    model: index_1.Schedule,
                    as: "groupSchedules", // Yangi alias
                    include: [{ model: index_1.Room, as: "room", attributes: ["id", "name"] }],
                },
            ],
        });
        if (!group)
            return next(base_error_1.BaseError.BadRequest(404, "Guruh topilmadi (yoki ruxsat yo'q)"));
        // StudentGroup orqali guruhga bog'langan o'quvchilarni olish
        const studentsInThisGroup = await index_1.Student.findAll({
            where: (0, branch_scope_helper_1.withBranchScope)(req), // student.branch_id filter
            include: [{
                    model: student_groups_model_1.default,
                    as: "studentGroups",
                    where: { group_id: group.dataValues.id },
                    attributes: [],
                }],
        });
        res.status(200).json({ group, studentsInThisGroup });
    }
    catch (error) {
        next(error);
    }
}
async function getOneGroupForTeacherAttendance(req, res, next) {
    try {
        const groupId = req.query.group_id;
        if (!groupId)
            return res.status(400).json({ error: "group_id required" });
        const group = await index_1.Group.findByPk(groupId, {
            attributes: ["id", "group_subject", "days", "start_time", "end_time"],
            include: [
                {
                    model: index_1.Teacher,
                    as: "teacher",
                    attributes: ["first_name", "last_name"],
                },
            ],
        });
        if (!group) {
            return next(base_error_1.BaseError.BadRequest(404, "Guruh topilmadi"));
        }
        res.status(200).json(group);
    }
    catch (error) {
        next(error);
    }
}
async function createGroup(req, res, next) {
    try {
        const lang = "uz";
        const { group_subject, days, start_time, end_time, teacher_id, monthly_fee, room_id, } = req.body;
        // Validatsiya
        if (!group_subject ||
            !teacher_id ||
            !room_id ||
            !days ||
            !start_time ||
            !end_time) {
            return next(base_error_1.BaseError.BadRequest(400, lang_1.default.t("missing_parameters", { lng: lang })));
        }
        // UUID formatini tekshirish
        if (!(0, uuid_1.validate)(room_id) || !(0, uuid_1.validate)(teacher_id)) {
            return next(base_error_1.BaseError.BadRequest(400, lang_1.default.t("invalid_uuid_format", { lng: lang })));
        }
        const scope = req.scope;
        const branch_id = scope?.all ? req.body.branch_id : scope.branchIds?.[0];
        if (!branch_id)
            return next(base_error_1.BaseError.BadRequest(400, "branch_id required"));
        const room = await index_1.Room.findOne({ where: (0, branch_scope_helper_1.withBranchScope)(req, { id: room_id }) });
        if (!room)
            return next(base_error_1.BaseError.BadRequest(404, "Room topilmadi (yoki ruxsat yo'q)"));
        const teacher = await index_1.Teacher.findOne({ where: (0, branch_scope_helper_1.withBranchScope)(req, { id: teacher_id }) });
        if (!teacher)
            return next(base_error_1.BaseError.BadRequest(404, "Teacher topilmadi (yoki ruxsat yo'q)"));
        const parsedDays = days.split("-").map((item) => item.toUpperCase());
        for (const day of parsedDays) {
            const conflictingSchedules = await index_1.Schedule.findAll({
                where: {
                    room_id,
                    day,
                    [sequelize_1.Op.and]: [
                        { start_time: { [sequelize_1.Op.lt]: end_time } },
                        { end_time: { [sequelize_1.Op.gt]: start_time } },
                    ],
                },
            });
            if (conflictingSchedules.length > 0) {
                return next(base_error_1.BaseError.BadRequest(400, lang_1.default.t("room_conflict", { lng: lang })));
            }
        }
        // Guruh yaratish
        const group = await index_1.Group.create({
            group_subject,
            days: parsedDays.join("-"), // O'zbekcha kunlarni saqlash uchun
            start_time,
            end_time,
            teacher_id,
            monthly_fee,
            room_id,
            branch_id
        });
        // Jadval yozuvlarini yaratish
        for (const day of parsedDays) {
            await index_1.Schedule.create({
                room_id,
                group_id: group.dataValues.id,
                teacher_id,
                day,
                start_time,
                end_time,
            });
        }
        res.status(201).json({
            message: lang_1.default.t("group_created", { lng: lang }),
            group,
        });
    }
    catch (error) {
        console.error("Create group error:", error);
        next(error);
    }
}
async function updateGroup(req, res, next) {
    try {
        const lang = "uz";
        const { group_subject, days, start_time, end_time, teacher_id, room_id, monthly_fee, } = req.body;
        const group = await index_1.Group.findOne({
            where: (0, branch_scope_helper_1.withBranchScope)(req, { id: req.params.id }),
        });
        if (!group)
            return next(base_error_1.BaseError.BadRequest(404, "Guruh topilmadi (yoki ruxsat yo'q)"));
        if (!group) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("group_not_found", { lng: lang })));
        }
        if (room_id && days && start_time && end_time) {
            if (!(0, uuid_1.validate)(room_id) || (teacher_id && !(0, uuid_1.validate)(teacher_id))) {
                return next(base_error_1.BaseError.BadRequest(400, lang_1.default.t("invalid_uuid_format", { lng: lang })));
            }
            const room = await index_1.Room.findByPk(room_id);
            if (!room) {
                return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("room_not_found", { lng: lang })));
            }
            const parsedDays = days.split("-");
            // Vaqt to‘qnashuvini tekshirish (o‘z guruhini hisobga olmagan holda)
            for (const day of parsedDays) {
                const conflictingSchedules = await index_1.Schedule.findAll({
                    where: {
                        room_id,
                        day,
                        [sequelize_1.Op.and]: [
                            { start_time: { [sequelize_1.Op.lt]: end_time } },
                            { end_time: { [sequelize_1.Op.gt]: start_time } },
                        ],
                        group_id: { [sequelize_1.Op.ne]: group.dataValues.id },
                    },
                });
                if (conflictingSchedules.length > 0) {
                    return next(base_error_1.BaseError.BadRequest(400, lang_1.default.t("room_conflict", { lng: lang })));
                }
            }
            // Eski jadvalni o‘chirish va yangisini yaratish
            await index_1.Schedule.destroy({ where: { group_id: group.dataValues.id } });
            for (const day of parsedDays) {
                await index_1.Schedule.create({
                    room_id,
                    group_id: group.dataValues.id,
                    teacher_id: teacher_id || group.dataValues.teacher_id,
                    day,
                    start_time,
                    end_time,
                });
            }
        }
        await group.update({
            group_subject,
            days: days,
            start_time,
            end_time,
            teacher_id,
            room_id,
            monthly_fee,
        });
        res.status(200).json({
            message: lang_1.default.t("group_updated", { lng: lang }),
            group,
        });
    }
    catch (error) {
        console.error("Update group error:", error);
        next(error);
    }
}
async function deleteGroup(req, res, next) {
    try {
        const lang = "uz";
        const group = await index_1.Group.findOne({
            where: (0, branch_scope_helper_1.withBranchScope)(req, { id: req.params.id }),
        });
        if (!group) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("group_not_found", { lng: lang })));
        }
        await index_1.Schedule.destroy({ where: { group_id: group.dataValues.id } });
        await student_groups_model_1.default.destroy({ where: { group_id: group.dataValues.id } });
        await index_1.Payment.destroy({ where: { pupil_id: group.dataValues.id } });
        await group.destroy();
        res.status(200).json({
            message: lang_1.default.t("group_deleted", { lng: lang }),
        });
    }
    catch (error) {
        next(error);
    }
}
