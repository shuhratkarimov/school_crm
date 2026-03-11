import { Request, Response, NextFunction } from "express";
import Feedback from "../Models/feedback_model";
import { Teacher, User, Branch } from "../Models";

async function createFeedbackByAdmin(
    req: any,
    res: Response,
    next: NextFunction
): Promise<void> {
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

        const user = await User.findByPk(req.user?.id);
        if (!user) {
            res.status(404).json({
                message: "User not found",
            });
            return;
        }

        const feedback = await Feedback.create({
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
    } catch (error) {
        next(error);
    }
}

async function createFeedbackByTeacher(
    req: any,
    res: Response,
    next: NextFunction
): Promise<void> {
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

        const teacher = await Teacher.findByPk(req.teacher?.id);
        if (!teacher) {
            res.status(404).json({
                message: "Teacher not found",
            });
            return;
        }

        const feedback = await Feedback.create({
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
    } catch (error) {
        next(error);
    }
}

async function getFeedbacksBySuperadmin(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const feedbacks = await Feedback.findAll({
            include: [
                { model: User, as: "userSender", attributes: ["id", "username", "email"], required: false },
                { model: Teacher, as: "teacherSender", attributes: ["id", "username"], required: false },
                { model: Branch, as: "branch", attributes: ["id", "name"], required: false },
            ],
            order: [["created_at", "DESC"]],
        });

        res.status(200).json({
            feedbacks,
        });
    } catch (error) {
        next(error);
    }
}

async function markFeedbackAsViewed(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.body;

        if (!id) {
            res.status(400).json({
                message: "Feedback id not provided!",
            });
            return;
        }

        const foundFeedback = await Feedback.findByPk(id);
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

        await Feedback.update({ status: "reviewed" }, { where: { id } });

        res.status(200).json({
            message: "Feedback statusi ko'rilganga o'zgartirildi!",
        });
    } catch (error) {
        next(error);
    }
}

async function getMyTeacherFeedbacks(
    req: any,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.teacher?.id) {
            res.status(401).json({
                message: "Teacher aniqlanmadi",
            });
            return;
        }

        const feedbacks = await Feedback.findAll({
            where: {
                sender_id: req.teacher.id,
                sender_type: "teacher",
            },
            order: [["created_at", "DESC"]],
        });

        res.status(200).json({
            feedbacks,
        });
    } catch (error) {
        next(error);
    }
}

async function markFeedbackAsResolved(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.body;

        if (!id) {
            res.status(400).json({
                message: "Feedback id not provided!",
            });
            return;
        }

        const foundFeedback = await Feedback.findByPk(id);
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

        await Feedback.update({ status: "resolved" }, { where: { id } });

        res.status(200).json({
            message: "Feedback statusi hal qilindiga o'zgartirildi!",
        });
    } catch (error) {
        next(error);
    }
}

export {
    createFeedbackByAdmin,
    createFeedbackByTeacher,
    markFeedbackAsResolved,
    markFeedbackAsViewed,
    getFeedbacksBySuperadmin,
    getMyTeacherFeedbacks,
};