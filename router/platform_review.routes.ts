import { shouldShowPlatformReview } from "../controller/platform_review.ctr";
import { router } from "./feedback.routes";
import { platformReviewAuth } from "../middlewares/platform-review-auth";
import { submitPlatformReview } from "../controller/platform_review.ctr";
import { dismissPlatformReview } from "../controller/platform_review.ctr";
import { RequestHandler } from "express";
import { authMiddleware } from "../middlewares/auth-guard.middleware";
import { superadminMiddleware } from "../middlewares/admin.middleware";
import { getPlatformReviews } from "../controller/platform_review.ctr";

router.get('/platform-review/should-show', platformReviewAuth, shouldShowPlatformReview as RequestHandler);
router.post('/platform-review', platformReviewAuth, submitPlatformReview as RequestHandler);
router.post('/platform-review/dismiss', platformReviewAuth, dismissPlatformReview as RequestHandler);
router.get("/superadmin/platform-reviews", authMiddleware, superadminMiddleware, getPlatformReviews as RequestHandler);
export default router;
