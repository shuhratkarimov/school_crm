"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReserveStudent = exports.approveReserveStudentsBulk = exports.deleteReserveStudentsBulk = exports.deleteReserveStudent = exports.updateReserveStudent = exports.getReserveStudents = exports.importStudents = exports.startImportStudents = exports.startApproveReserveStudentsBulk = exports.startDeleteReserveStudentsBulk = exports.streamBulkJobProgress = void 0;
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
const uuid_2 = require("uuid");
const sse_jobs_1 = require("../Utils/sse_jobs");
const streamBulkJobProgress = async (req, res) => {
    const { jobId } = req.params;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    const send = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    const interval = setInterval(() => {
        const job = (0, sse_jobs_1.getBulkJob)(jobId);
        if (!job) {
            send({
                status: "error",
                message: "Job topilmadi",
                done: true,
            });
            clearInterval(interval);
            return res.end();
        }
        send({
            ...job,
            done: job.status === "done" || job.status === "error",
        });
        if (job.status === "done" || job.status === "error") {
            clearInterval(interval);
            return res.end();
        }
    }, 500);
    req.on("close", () => {
        clearInterval(interval);
        res.end();
    });
};
exports.streamBulkJobProgress = streamBulkJobProgress;
const startDeleteReserveStudentsBulk = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return next(base_error_1.BaseError.BadRequest(400, "ids massiv bo'lishi kerak va bo'sh bo'lmasligi kerak"));
        }
        const scopedStudents = await reserve_student_model_1.ReserveStudent.findAll({
            where: (0, branch_scope_helper_1.withBranchScope)(req, {
                id: { [sequelize_1.Op.in]: ids },
            }),
            attributes: ["id"],
        });
        const allowedIds = scopedStudents.map((student) => String(student.get("id")));
        if (allowedIds.length !== ids.length) {
            return next(base_error_1.BaseError.BadRequest(403, "Ba'zi o'quvchilar topilmadi yoki ruxsat yo'q"));
        }
        const jobId = (0, uuid_2.v4)();
        (0, sse_jobs_1.createBulkJob)(jobId, "delete_reserve_students_bulk", allowedIds.length);
        res.status(202).json({
            success: true,
            jobId,
            message: "Bulk delete boshlandi",
        });
        setImmediate(async () => {
            try {
                (0, sse_jobs_1.updateBulkJob)(jobId, {
                    status: "running",
                    message: "O'chirish boshlandi",
                });
                let successCount = 0;
                let failedCount = 0;
                for (let i = 0; i < allowedIds.length; i++) {
                    const id = allowedIds[i];
                    try {
                        const student = await reserve_student_model_1.ReserveStudent.findOne({
                            where: (0, branch_scope_helper_1.withBranchScope)(req, { id }),
                        });
                        if (student) {
                            await student.destroy();
                            successCount++;
                        }
                        else {
                            failedCount++;
                        }
                    }
                    catch (err) {
                        failedCount++;
                    }
                    const processed = i + 1;
                    const percent = Math.round((processed / allowedIds.length) * 100);
                    (0, sse_jobs_1.updateBulkJob)(jobId, {
                        processed,
                        percent,
                        successCount,
                        failedCount,
                        message: `${processed}/${allowedIds.length} ta o'quvchi o'chirildi`,
                    });
                }
                (0, sse_jobs_1.updateBulkJob)(jobId, {
                    status: "done",
                    percent: 100,
                    processed: allowedIds.length,
                    successCount,
                    failedCount,
                    message: `${successCount} ta o'quvchi o'chirildi`,
                });
            }
            catch (err) {
                (0, sse_jobs_1.updateBulkJob)(jobId, {
                    status: "error",
                    message: err?.message || "Bulk delete jarayonida xato",
                });
            }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.startDeleteReserveStudentsBulk = startDeleteReserveStudentsBulk;
const startApproveReserveStudentsBulk = async (req, res, next) => {
    const { reserve_student_ids = [], group_ids = [] } = req.body;
    try {
        if (!Array.isArray(reserve_student_ids) || reserve_student_ids.length === 0) {
            return next(base_error_1.BaseError.BadRequest(400, "reserve_student_ids massiv bo'lishi kerak"));
        }
        if (!Array.isArray(group_ids) || group_ids.length === 0) {
            return next(base_error_1.BaseError.BadRequest(400, "group_ids massiv bo'lishi kerak"));
        }
        const reserves = await reserve_student_model_1.ReserveStudent.findAll({
            where: (0, branch_scope_helper_1.withBranchScope)(req, {
                id: { [sequelize_1.Op.in]: reserve_student_ids },
            }),
        });
        if (reserves.length !== reserve_student_ids.length) {
            return next(base_error_1.BaseError.BadRequest(404, "Ba'zi zaxiradagi o'quvchilar topilmadi yoki ruxsat yo'q"));
        }
        const allowedGroups = await index_1.Group.findAll({
            where: (0, branch_scope_helper_1.withBranchScope)(req, {
                id: { [sequelize_1.Op.in]: group_ids },
            }),
            attributes: ["id", "group_subject"],
        });
        if (allowedGroups.length !== group_ids.length) {
            return next(base_error_1.BaseError.BadRequest(403, "Group ro'yxatida ruxsatsiz guruh bor"));
        }
        const safeGroupIds = allowedGroups.map((g) => String(g.get("id")));
        const groupMap = new Map(allowedGroups.map((g) => [String(g.get("id")), g]));
        const jobId = (0, uuid_2.v4)();
        (0, sse_jobs_1.createBulkJob)(jobId, "approve_reserve_students_bulk", reserves.length);
        res.status(202).json({
            success: true,
            jobId,
            message: "Bulk approve boshlandi",
        });
        setImmediate(async () => {
            try {
                (0, sse_jobs_1.updateBulkJob)(jobId, {
                    status: "running",
                    message: "O'quvchilarni o'tkazish boshlandi",
                });
                let successCount = 0;
                let failedCount = 0;
                const currentYear = new Date().getFullYear();
                const currentMonthIndex = new Date().getMonth() + 1;
                const monthsToCreate = [];
                for (let m = currentMonthIndex; m <= 12; m++) {
                    monthsToCreate.push(student_ctr_1.monthsInUzbek[m]);
                }
                for (let i = 0; i < reserves.length; i++) {
                    const reserve = reserves[i];
                    try {
                        await database_config_1.default.transaction(async (t) => {
                            const ReturnedId = await (0, student_ctr_1.generateStudentId)();
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
                            for (const gid of safeGroupIds) {
                                for (const month of monthsToCreate) {
                                    await student_groups_model_1.default.findOrCreate({
                                        where: {
                                            student_id: newStudent.dataValues.id,
                                            group_id: gid,
                                            month,
                                            year: currentYear,
                                        },
                                        defaults: { paid: false },
                                        transaction: t,
                                    });
                                }
                                const group = groupMap.get(String(gid));
                                if (group) {
                                    await group.increment("students_amount", { by: 1, transaction: t });
                                }
                            }
                            await reserve.destroy({ transaction: t });
                        });
                        successCount++;
                    }
                    catch (err) {
                        failedCount++;
                    }
                    const processed = i + 1;
                    const percent = Math.round((processed / reserves.length) * 100);
                    (0, sse_jobs_1.updateBulkJob)(jobId, {
                        processed,
                        percent,
                        successCount,
                        failedCount,
                        message: `${processed}/${reserves.length} ta o'quvchi o'tkazildi`,
                    });
                }
                (0, sse_jobs_1.updateBulkJob)(jobId, {
                    status: "done",
                    percent: 100,
                    processed: reserves.length,
                    successCount,
                    failedCount,
                    message: `${successCount} ta o'quvchi students jadvaliga o'tkazildi`,
                });
            }
            catch (err) {
                (0, sse_jobs_1.updateBulkJob)(jobId, {
                    status: "error",
                    message: err?.message || "Bulk approve jarayonida xato",
                });
            }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.startApproveReserveStudentsBulk = startApproveReserveStudentsBulk;
const startImportStudents = async (req, res, next) => {
    try {
        const scope = req.scope;
        const branch_id = scope?.all ? req.body.branch_id : scope.branchIds?.[0];
        if (!branch_id)
            return next(base_error_1.BaseError.BadRequest(400, "branch_id required"));
        if (!req.body || !req.body.students) {
            return next(base_error_1.BaseError.BadRequest(400, "students maydoni majburiy"));
        }
        if (!Array.isArray(req.body.students)) {
            return next(base_error_1.BaseError.BadRequest(400, "students massiv bo'lishi kerak"));
        }
        const students = req.body.students;
        const jobId = (0, uuid_2.v4)();
        (0, sse_jobs_1.createBulkJob)(jobId, "import_students", students.length);
        res.status(202).json({
            success: true,
            jobId,
            message: "Import boshlandi",
        });
        setImmediate(async () => {
            try {
                (0, sse_jobs_1.updateBulkJob)(jobId, {
                    status: "running",
                    message: "Import boshlandi",
                });
                let successCount = 0;
                let failedCount = 0;
                const errors = [];
                for (let i = 0; i < students.length; i++) {
                    const data = students[i];
                    try {
                        await reserve_student_model_1.ReserveStudent.create({
                            first_name: data.first_name,
                            last_name: data.last_name,
                            father_name: data.father_name,
                            mother_name: data.mother_name,
                            birth_date: data.birth_date ? new Date(data.birth_date) : null,
                            phone_number: data.phone_number,
                            parents_phone_number: data.parents_phone_number,
                            came_in_school: data.came_in_school ? new Date(data.came_in_school) : null,
                            status: "new",
                            created_at: new Date(),
                            branch_id,
                        });
                        successCount++;
                    }
                    catch (err) {
                        failedCount++;
                        errors.push(`${i + 1}-qator: ${err?.message || "Xato"}`);
                    }
                    const processed = i + 1;
                    const percent = Math.round((processed / students.length) * 100);
                    (0, sse_jobs_1.updateBulkJob)(jobId, {
                        processed,
                        percent,
                        successCount,
                        failedCount,
                        errors,
                        message: `${processed}/${students.length} ta o'quvchi import qilindi`,
                    });
                }
                (0, sse_jobs_1.updateBulkJob)(jobId, {
                    status: "done",
                    percent: 100,
                    processed: students.length,
                    successCount,
                    failedCount,
                    errors,
                    message: `${successCount} ta o'quvchi import qilindi`,
                });
            }
            catch (err) {
                (0, sse_jobs_1.updateBulkJob)(jobId, {
                    status: "error",
                    message: err?.message || "Import jarayonida xato",
                });
            }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.startImportStudents = startImportStudents;
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
        const scope = req.scope;
        const branch_id = scope?.all ? req.body.branch_id : scope.branchIds?.[0];
        if (!branch_id)
            return next(base_error_1.BaseError.BadRequest(400, "branch_id required"));
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
                const reserveStudent = await reserve_student_model_1.ReserveStudent.create({
                    first_name: data.first_name,
                    last_name: data.last_name,
                    father_name: data.father_name,
                    mother_name: data.mother_name,
                    birth_date: data.birth_date ? new Date(data.birth_date) : null,
                    phone_number: data.phone_number,
                    parents_phone_number: data.parents_phone_number,
                    came_in_school: data.came_in_school ? new Date(data.came_in_school) : null,
                    status: "new",
                    created_at: new Date(),
                    branch_id: branch_id,
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
        return;
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
        if (!student) {
            return next(base_error_1.BaseError.BadRequest(404, "Topilmadi (yoki ruxsat yo'q)"));
        }
        await student.update({
            ...data,
            birth_date: data.birth_date ? new Date(data.birth_date) : student.dataValues.birth_date,
            came_in_school: data.came_in_school ? new Date(data.came_in_school) : student.dataValues.came_in_school,
        });
        return res.status(200).json({
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
const deleteReserveStudentsBulk = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return next(base_error_1.BaseError.BadRequest(400, "ids massiv bo'lishi kerak va bo'sh bo'lmasligi kerak"));
        }
        const scopedStudents = await reserve_student_model_1.ReserveStudent.findAll({
            where: (0, branch_scope_helper_1.withBranchScope)(req, {
                id: {
                    [sequelize_1.Op.in]: ids,
                },
            }),
            attributes: ["id"],
        });
        const allowedIds = scopedStudents.map((student) => String(student.get("id")));
        if (allowedIds.length !== ids.length) {
            return next(base_error_1.BaseError.BadRequest(403, "Ba'zi o'quvchilar topilmadi yoki ruxsat yo'q"));
        }
        const deletedCount = await reserve_student_model_1.ReserveStudent.destroy({
            where: (0, branch_scope_helper_1.withBranchScope)(req, {
                id: {
                    [sequelize_1.Op.in]: ids,
                },
            }),
        });
        return res.status(200).json({
            success: true,
            message: `${deletedCount} ta o'quvchi zaxiradan o'chirildi`,
            deletedCount,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteReserveStudentsBulk = deleteReserveStudentsBulk;
const approveReserveStudentsBulk = async (req, res, next) => {
    const { reserve_student_ids = [], group_ids = [] } = req.body;
    try {
        if (!Array.isArray(reserve_student_ids) || reserve_student_ids.length === 0) {
            return next(base_error_1.BaseError.BadRequest(400, "reserve_student_ids massiv bo'lishi kerak"));
        }
        if (!Array.isArray(group_ids) || group_ids.length === 0) {
            return next(base_error_1.BaseError.BadRequest(400, "group_ids massiv bo'lishi kerak"));
        }
        const reserves = await reserve_student_model_1.ReserveStudent.findAll({
            where: (0, branch_scope_helper_1.withBranchScope)(req, {
                id: {
                    [sequelize_1.Op.in]: reserve_student_ids,
                },
            }),
        });
        if (reserves.length !== reserve_student_ids.length) {
            return next(base_error_1.BaseError.BadRequest(404, "Ba'zi zaxiradagi o'quvchilar topilmadi yoki ruxsat yo'q"));
        }
        const allowedGroups = await index_1.Group.findAll({
            where: (0, branch_scope_helper_1.withBranchScope)(req, {
                id: {
                    [sequelize_1.Op.in]: group_ids,
                },
            }),
            attributes: ["id", "group_subject"],
        });
        if (allowedGroups.length !== group_ids.length) {
            return next(base_error_1.BaseError.BadRequest(403, "Group ro'yxatida ruxsatsiz guruh bor"));
        }
        const safeGroupIds = allowedGroups.map((g) => String(g.get("id")));
        let createdStudentsCount = 0;
        await database_config_1.default.transaction(async (t) => {
            const currentYear = new Date().getFullYear();
            const currentMonthIndex = new Date().getMonth() + 1;
            const monthsToCreate = [];
            for (let m = currentMonthIndex; m <= 12; m++) {
                monthsToCreate.push(student_ctr_1.monthsInUzbek[m]);
            }
            for (const reserve of reserves) {
                const ReturnedId = await (0, student_ctr_1.generateStudentId)();
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
                await reserve.destroy({ transaction: t });
                await (0, student_ctr_1.updateStudentPaymentStatus)(newStudent.dataValues.id);
                createdStudentsCount++;
            }
        });
        return res.status(200).json({
            success: true,
            message: `${createdStudentsCount} ta o'quvchi students jadvaliga o'tkazildi va guruhlarga biriktirildi`,
            count: createdStudentsCount,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.approveReserveStudentsBulk = approveReserveStudentsBulk;
async function getGroups(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit) || 10));
        const search = (req.query.search || "").trim();
        const offset = (page - 1) * limit;
        const searchWhere = search ? { group_subject: { [sequelize_1.Op.iLike]: `%${search}%` } } : {};
        const whereClause = (0, branch_scope_helper_1.withBranchScope)(req, searchWhere);
        const { count, rows: groups } = await index_1.Group.findAndCountAll({
            where: whereClause,
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
                    as: "groupSchedules",
                    include: [{ model: index_1.Room, as: "room", attributes: ["id", "name"] }],
                },
                {
                    model: index_1.Room,
                    as: "room",
                    attributes: ["id", "name", "capacity"],
                },
            ],
            limit,
            offset,
            order: [["created_at", "DESC"]],
            distinct: true,
        });
        res.json({
            data: groups,
            total: count,
            page,
            limit,
            totalPages: count > 0 ? Math.ceil(count / limit) : 1,
        });
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
                {
                    model: index_1.Room,
                    as: "room",
                    attributes: ["id", "name", "capacity"],
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
function timeToMinutes(time) {
    const [hour, minute] = String(time).split(":").map(Number);
    return hour * 60 + minute;
}
function isValidTimeFormat(time) {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(time));
}
function validateGroupTimeRange(start_time, end_time) {
    if (!isValidTimeFormat(start_time.slice(0, 5)) || !isValidTimeFormat(end_time.slice(0, 5))) {
        return "Vaqt formati noto'g'ri. HH:mm ko'rinishida yuboring";
    }
    const WORK_START = 9 * 60; // 09:00
    const WORK_END = 18 * 60; // 18:00
    const startMinutes = timeToMinutes(start_time);
    const endMinutes = timeToMinutes(end_time);
    if (startMinutes < WORK_START || endMinutes > WORK_END) {
        return "Dars vaqti 09:00 dan 18:00 gacha bo'lishi kerak";
    }
    if (endMinutes <= startMinutes) {
        return "Dars tugash vaqti boshlanish vaqtidan katta bo'lishi kerak";
    }
    return null;
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
        const timeValidationError = validateGroupTimeRange(start_time, end_time);
        if (timeValidationError) {
            return next(base_error_1.BaseError.BadRequest(400, timeValidationError));
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
            const timeValidationError = validateGroupTimeRange(start_time, end_time);
            if (timeValidationError) {
                return next(base_error_1.BaseError.BadRequest(400, timeValidationError));
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
