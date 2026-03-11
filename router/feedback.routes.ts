import { Router } from "express";
import { createFeedbackByAdmin, createFeedbackByTeacher, getFeedbacksBySuperadmin, markFeedbackAsResolved, markFeedbackAsViewed, getMyTeacherFeedbacks } from "../controller/feedback.ctr";
import { authMiddleware } from "../middlewares/auth-guard.middleware";
import { teacherAuthMiddleware } from "../middlewares/teacher-auth.middleware";
import { superadminMiddleware } from "../middlewares/admin.middleware";

const router = Router();

router.post("/feedbacks/admin", authMiddleware, createFeedbackByAdmin);
router.post("/feedbacks/teacher", teacherAuthMiddleware, createFeedbackByTeacher);
router.get("/get_feedbacks", authMiddleware, superadminMiddleware, getFeedbacksBySuperadmin)
router.put("/set_feedback_viewed", authMiddleware, superadminMiddleware, markFeedbackAsViewed)
router.put("/set_feedback_resolved", authMiddleware, superadminMiddleware, markFeedbackAsResolved)
router.get(
    "/feedbacks/teacher/my",
    teacherAuthMiddleware,
    getMyTeacherFeedbacks
  );
export {
    router
};  