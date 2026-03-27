import { NextFunction, Request, Response } from 'express';
import { PlatformReview } from '../Models/platform-review_model';
import Teacher from '../Models/teacher_model';
import { User } from '../Models/user_model';
import { BaseError } from '../Utils/base_error';

function getActorModel(actorType: 'teacher' | 'user') {
    return actorType === 'teacher' ? Teacher : User;
}

export const shouldShowPlatformReview = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        if (!req.actor || !req.actorType) {
            return next(BaseError.BadRequest(401, 'Unauthorized'));
        }

        const Model = getActorModel(req.actorType);

        const actor = await Model.findByPk((req.actor as any).id, {
            attributes: [
                'id',
                'platform_review_shown_at',
                'platform_review_submitted_at',
                'platform_review_dismissed_at',
            ],
        });

        if (!actor) {
            return next(BaseError.BadRequest(401, 'Account topilmadi'));
        }

        const submittedAt = (actor as any).platform_review_submitted_at;
        const dismissedAt = (actor as any).platform_review_dismissed_at;

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
    } catch (error: any) {
        return next(BaseError.BadRequest(500, error.message));
    }
};

export const submitPlatformReview = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        if (!req.actor || !req.actorType) {
            return next(BaseError.BadRequest(401, 'Unauthorized'));
        }

        const { rating, comment } = req.body;

        const normalizedRating = Number(rating);

        if (Number.isNaN(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
            return next(BaseError.BadRequest(400, 'Rating 1 dan 5 gacha bo‘lishi kerak'));
        }

        const existing = await PlatformReview.findOne({
            where: {
                actor_type: req.actorType,
                actor_id: (req.actor as any).id,
            },
        });

        if (existing) {
            return next(BaseError.BadRequest(409, 'Siz allaqachon baho qoldirgansiz'));
        }

        const review = await PlatformReview.create({
            actor_type: req.actorType,
            actor_id: (req.actor as any).id,
            rating: normalizedRating,
            comment: typeof comment === 'string' ? comment.trim() : null,
        });

        const Model = getActorModel(req.actorType);

        await Model.update(
            {
                platform_review_submitted_at: new Date(),
                platform_review_shown_at: new Date(),
                platform_review_dismissed_at: null,
            },
            {
                where: {
                    id: (req.actor as any).id,
                },
            }
        );

        return res.status(201).json({
            success: true,
            message: 'Review saqlandi',
            data: review,
        });
    } catch (error: any) {
        return next(BaseError.BadRequest(500, error.message));
    }
};

export const dismissPlatformReview = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        if (!req.actor || !req.actorType) {
            return next(BaseError.BadRequest(401, 'Unauthorized'));
        }

        const actorId = (req.actor as any).id;
        const Model = getActorModel(req.actorType);

        const actor = await Model.findByPk(actorId, {
            attributes: [
                'id',
                'platform_review_submitted_at',
                'platform_review_dismissed_at',
            ],
        });

        if (!actor) {
            return next(BaseError.BadRequest(404, 'Account topilmadi'));
        }

        if ((actor as any).platform_review_submitted_at) {
            return res.status(200).json({
                success: true,
                message: 'Review allaqachon yuborilgan',
                reason: 'already_submitted',
            });
        }

        await Model.update(
            {
                platform_review_dismissed_at: new Date(),
            },
            {
                where: {
                    id: actorId,
                },
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Review keyinroqqa qoldirildi',
        });
    } catch (error: any) {
        return next(BaseError.BadRequest(500, error.message));
    }
};

export const getPlatformReviews = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const reviews = await PlatformReview.findAll({
        order: [["created_at", "DESC"]],
        raw: true,
      });
  
      const userIds = reviews
        .filter((r: any) => r.actor_type === "user")
        .map((r: any) => r.actor_id);
  
      const teacherIds = reviews
        .filter((r: any) => r.actor_type === "teacher")
        .map((r: any) => r.actor_id);
  
      const [users, teachers] = await Promise.all([
        userIds.length
          ? User.findAll({
              where: { id: userIds },
              attributes: ["id", "username", "email", "branch_id"],
              raw: true,
            })
          : [],
        teacherIds.length
          ? Teacher.findAll({
              where: { id: teacherIds },
              attributes: ["id", "username", "branch_id"],
              raw: true,
            })
          : [],
      ]);
  
      const userMap = new Map(users.map((u: any) => [u.id, u]));
      const teacherMap = new Map(teachers.map((t: any) => [t.id, t]));
  
      const enriched = reviews.map((review: any) => {
        const actor =
          review.actor_type === "user"
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
    } catch (error: any) {
      return next(BaseError.BadRequest(500, error.message));
    }
  };