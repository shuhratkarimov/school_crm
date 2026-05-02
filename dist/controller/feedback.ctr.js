"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFeedbackByAdmin = createFeedbackByAdmin;
exports.createFeedbackByTeacher = createFeedbackByTeacher;
exports.markFeedbackAsResolved = markFeedbackAsResolved;
exports.markFeedbackAsViewed = markFeedbackAsViewed;
exports.getFeedbacksBySuperadmin = getFeedbacksBySuperadmin;
exports.getMyTeacherFeedbacks = getMyTeacherFeedbacks;
exports.getMyAdminFeedbacks = getMyAdminFeedbacks;
const feedback_model_1 = __importDefault(require("../Models/feedback_model"));
const Models_1 = require("../Models");
async function createFeedbackByAdmin(req, res, next) {
    try {
        const { type, subject, message } = req.body;
        if (!type || !subject || !message) {
            res.status(400).json({
                message: "type, subject va message majburiy",
            });
            return;
        }
        if (!["feedback", "bug"].includes(type)) {
            res.status(400).json({
                message: "type faqat feedback yoki bug bo‘lishi mumkin",
            });
            return;
        }
        if (!req.user?.id) {
            res.status(400).json({
                message: "User id majburiy",
            });
            return;
        }
        const user = await Models_1.User.findByPk(req.user?.id);
        if (!user) {
            res.status(404).json({
                message: "User not found",
            });
            return;
        }
        const feedback = await feedback_model_1.default.create({
            type,
            subject: String(subject).trim(),
            message: String(message).trim(),
            status: "new",
            sender_id: user.dataValues.id,
            sender_type: "user",
            branch_id: user.dataValues.branch_id,
        });
        res.status(201).json({
            message: "Feedback muvaffaqiyatli yaratildi",
            feedback,
        });
    }
    catch (error) {
        next(error);
    }
}
async function createFeedbackByTeacher(req, res, next) {
    try {
        const { type, subject, message } = req.body;
        if (!type || !subject || !message) {
            res.status(400).json({
                message: "type, subject va message majburiy",
            });
            return;
        }
        if (!["feedback", "bug"].includes(type)) {
            res.status(400).json({
                message: "type faqat feedback yoki bug bo‘lishi mumkin",
            });
            return;
        }
        if (!req.teacher?.id) {
            res.status(400).json({
                message: "Teacher id majburiy",
            });
            return;
        }
        const teacher = await Models_1.Teacher.findByPk(req.teacher?.id);
        if (!teacher) {
            res.status(404).json({
                message: "Teacher not found",
            });
            return;
        }
        const feedback = await feedback_model_1.default.create({
            type,
            subject: String(subject).trim(),
            message: String(message).trim(),
            status: "new",
            sender_id: teacher.dataValues.id,
            sender_type: "teacher",
            branch_id: teacher.dataValues.branch_id,
        });
        res.status(201).json({
            message: "Feedback muvaffaqiyatli yaratildi",
            feedback,
        });
    }
    catch (error) {
        next(error);
    }
}
async function getFeedbacksBySuperadmin(req, res, next) {
    try {
        const feedbacks = await feedback_model_1.default.findAll({
            include: [
                { model: Models_1.User, as: "userSender", attributes: ["id", "username", "email"], required: false },
                { model: Models_1.Teacher, as: "teacherSender", attributes: ["id", "username"], required: false },
                { model: Models_1.Branch, as: "branch", attributes: ["id", "name"], required: false },
            ],
            order: [["created_at", "DESC"]],
        });
        res.status(200).json({
            feedbacks,
        });
    }
    catch (error) {
        next(error);
    }
}
async function markFeedbackAsViewed(req, res, next) {
    try {
        const { id } = req.body;
        if (!id) {
            res.status(400).json({
                message: "Feedback id not provided!",
            });
            return;
        }
        const foundFeedback = await feedback_model_1.default.findByPk(id);
        if (!foundFeedback) {
            res.status(404).json({
                message: "Feedback not found",
            });
            return;
        }
        if (foundFeedback.dataValues.status !== "new") {
            res.status(400).json({
                message: "Feedback statusi allaqachon o'zgargan!",
            });
            return;
        }
        await feedback_model_1.default.update({ status: "reviewed" }, { where: { id } });
        res.status(200).json({
            message: "Feedback statusi ko'rilganga o'zgartirildi!",
        });
    }
    catch (error) {
        next(error);
    }
}
async function getMyTeacherFeedbacks(req, res, next) {
    try {
        if (!req.teacher?.id) {
            res.status(401).json({
                message: "Teacher aniqlanmadi",
            });
            return;
        }
        const feedbacks = await feedback_model_1.default.findAll({
            where: {
                sender_id: req.teacher.id,
                sender_type: "teacher",
            },
            order: [["created_at", "DESC"]],
        });
        res.status(200).json({
            feedbacks,
        });
    }
    catch (error) {
        next(error);
    }
}
async function getMyAdminFeedbacks(req, res, next) {
    try {
        if (!req.user?.id) {
            res.status(401).json({
                message: "User aniqlanmadi",
            });
            return;
        }
        const feedbacks = await feedback_model_1.default.findAll({
            where: {
                sender_id: req.user.id,
                sender_type: "user",
            },
            order: [["created_at", "DESC"]],
        });
        res.status(200).json({
            feedbacks,
        });
    }
    catch (error) {
        next(error);
    }
}
async function markFeedbackAsResolved(req, res, next) {
    try {
        const { id } = req.body;
        if (!id) {
            res.status(400).json({
                message: "Feedback id not provided!",
            });
            return;
        }
        const foundFeedback = await feedback_model_1.default.findByPk(id);
        if (!foundFeedback) {
            res.status(404).json({
                message: "Feedback not found",
            });
            return;
        }
        if (foundFeedback.dataValues.status === "resolved") {
            res.status(400).json({
                message: "Feedback allaqachon yechilgan!",
            });
            return;
        }
        await feedback_model_1.default.update({ status: "resolved" }, { where: { id } });
        res.status(200).json({
            message: "Feedback statusi hal qilindiga o'zgartirildi!",
        });
    }
    catch (error) {
        next(error);
    }
}
