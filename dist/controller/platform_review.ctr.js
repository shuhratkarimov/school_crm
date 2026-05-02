"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatformReviews = exports.dismissPlatformReview = exports.submitPlatformReview = exports.shouldShowPlatformReview = void 0;
const platform_review_model_1 = require("../Models/platform-review_model");
const teacher_model_1 = __importDefault(require("../Models/teacher_model"));
const user_model_1 = require("../Models/user_model");
const base_error_1 = require("../Utils/base_error");
function getActorModel(actorType) {
    return actorType === 'teacher' ? teacher_model_1.default : user_model_1.User;
}
const shouldShowPlatformReview = async (req, res, next) => {
    try {
        if (!req.actor || !req.actorType) {
            return next(base_error_1.BaseError.BadRequest(401, 'Unauthorized'));
        }
        const Model = getActorModel(req.actorType);
        const actor = await Model.findByPk(req.actor.id, {
            attributes: [
                'id',
                'platform_review_shown_at',
                'platform_review_submitted_at',
                'platform_review_dismissed_at',
            ],
        });
        if (!actor) {
            return next(base_error_1.BaseError.BadRequest(401, 'Account topilmadi'));
        }
        const submittedAt = actor.platform_review_submitted_at;
        const dismissedAt = actor.platform_review_dismissed_at;
        if (submittedAt) {
            return res.json({
                success: true,
                show: false,
                reason: 'already_submitted',
            });
        }
        if (dismissedAt) {
            const dismissDate = new Date(dismissedAt);
            const nextEligibleAt = new Date(dismissDate.getTime() + 3 * 24 * 60 * 60 * 1000);
            if (new Date() < nextEligibleAt) {
                return res.json({
                    success: true,
                    show: false,
                    reason: 'dismissed_recently',
                    next_show_at: nextEligibleAt,
                });
            }
        }
        return res.json({
            success: true,
            show: true,
        });
    }
    catch (error) {
        return next(base_error_1.BaseError.BadRequest(500, error.message));
    }
};
exports.shouldShowPlatformReview = shouldShowPlatformReview;
const submitPlatformReview = async (req, res, next) => {
    try {
        if (!req.actor || !req.actorType) {
            return next(base_error_1.BaseError.BadRequest(401, 'Unauthorized'));
        }
        const { rating, comment } = req.body;
        const normalizedRating = Number(rating);
        if (Number.isNaN(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
            return next(base_error_1.BaseError.BadRequest(400, 'Rating 1 dan 5 gacha bo‘lishi kerak'));
        }
        const existing = await platform_review_model_1.PlatformReview.findOne({
            where: {
                actor_type: req.actorType,
                actor_id: req.actor.id,
            },
        });
        if (existing) {
            return next(base_error_1.BaseError.BadRequest(409, 'Siz allaqachon baho qoldirgansiz'));
        }
        const review = await platform_review_model_1.PlatformReview.create({
            actor_type: req.actorType,
            actor_id: req.actor.id,
            rating: normalizedRating,
            comment: typeof comment === 'string' ? comment.trim() : null,
        });
        const Model = getActorModel(req.actorType);
        await Model.update({
            platform_review_submitted_at: new Date(),
            platform_review_shown_at: new Date(),
            platform_review_dismissed_at: null,
        }, {
            where: {
                id: req.actor.id,
            },
        });
        return res.status(201).json({
            success: true,
            message: 'Review saqlandi',
            data: review,
        });
    }
    catch (error) {
        return next(base_error_1.BaseError.BadRequest(500, error.message));
    }
};
exports.submitPlatformReview = submitPlatformReview;
const dismissPlatformReview = async (req, res, next) => {
    try {
        if (!req.actor || !req.actorType) {
            return next(base_error_1.BaseError.BadRequest(401, 'Unauthorized'));
        }
        const actorId = req.actor.id;
        const Model = getActorModel(req.actorType);
        const actor = await Model.findByPk(actorId, {
            attributes: [
                'id',
                'platform_review_submitted_at',
                'platform_review_dismissed_at',
            ],
        });
        if (!actor) {
            return next(base_error_1.BaseError.BadRequest(404, 'Account topilmadi'));
        }
        if (actor.platform_review_submitted_at) {
            return res.status(200).json({
                success: true,
                message: 'Review allaqachon yuborilgan',
                reason: 'already_submitted',
            });
        }
        await Model.update({
            platform_review_dismissed_at: new Date(),
        }, {
            where: {
                id: actorId,
            },
        });
        return res.status(200).json({
            success: true,
            message: 'Review keyinroqqa qoldirildi',
        });
    }
    catch (error) {
        return next(base_error_1.BaseError.BadRequest(500, error.message));
    }
};
exports.dismissPlatformReview = dismissPlatformReview;
const getPlatformReviews = async (req, res, next) => {
    try {
        const reviews = await platform_review_model_1.PlatformReview.findAll({
            order: [["created_at", "DESC"]],
            raw: true,
        });
        const userIds = reviews
            .filter((r) => r.actor_type === "user")
            .map((r) => r.actor_id);
        const teacherIds = reviews
            .filter((r) => r.actor_type === "teacher")
            .map((r) => r.actor_id);
        const [users, teachers] = await Promise.all([
            userIds.length
                ? user_model_1.User.findAll({
                    where: { id: userIds },
                    attributes: ["id", "username", "email", "branch_id"],
                    raw: true,
                })
                : [],
            teacherIds.length
                ? teacher_model_1.default.findAll({
                    where: { id: teacherIds },
                    attributes: ["id", "username", "branch_id"],
                    raw: true,
                })
                : [],
        ]);
        const userMap = new Map(users.map((u) => [u.id, u]));
        const teacherMap = new Map(teachers.map((t) => [t.id, t]));
        const enriched = reviews.map((review) => {
            const actor = review.actor_type === "user"
                ? userMap.get(review.actor_id)
                : teacherMap.get(review.actor_id);
            return {
                ...review,
                actor: actor || null,
            };
        });
        return res.status(200).json({
            success: true,
            reviews: enriched,
        });
    }
    catch (error) {
        return next(base_error_1.BaseError.BadRequest(500, error.message));
    }
};
exports.getPlatformReviews = getPlatformReviews;
