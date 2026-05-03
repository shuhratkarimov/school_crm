import { Router, RequestHandler } from "express";
import { authMiddleware } from "../middlewares/auth-guard.middleware";
import { superadminMiddleware } from "../middlewares/admin.middleware";
import { teacherAuthMiddleware } from "../middlewares/teacher-auth.middleware";
import {
  adminListArticles,
  adminGetArticle,
  adminCreateArticle,
  adminUpdateArticle,
  adminDeleteArticle,
  adminListArticleRequests,
  adminUploadArticleImage,
  teacherListArticles,
  teacherGetArticle,
  teacherToggleLike,
  teacherListComments,
  teacherCreateComment,
  teacherCreateRequest,
} from "../controller/article.ctr";
import { uploadArticleImage } from "../middlewares/upload.middleware";

const ArticleRouter: Router = Router();

/* =============== Admin (superadmin) =============== */
ArticleRouter.get(
  "/admin/articles",
  authMiddleware,
  superadminMiddleware,
  adminListArticles as RequestHandler
);
ArticleRouter.get(
  "/admin/articles/:id",
  authMiddleware,
  superadminMiddleware,
  adminGetArticle as RequestHandler
);
ArticleRouter.post(
  "/admin/articles/upload-image",
  authMiddleware,
  superadminMiddleware,
  uploadArticleImage,
  adminUploadArticleImage as RequestHandler
);
ArticleRouter.post(
  "/admin/articles",
  authMiddleware,
  superadminMiddleware,
  adminCreateArticle as RequestHandler
);
ArticleRouter.put(
  "/admin/articles/:id",
  authMiddleware,
  superadminMiddleware,
  adminUpdateArticle as RequestHandler
);
ArticleRouter.delete(
  "/admin/articles/:id",
  authMiddleware,
  superadminMiddleware,
  adminDeleteArticle as RequestHandler
);
ArticleRouter.get(
  "/admin/article-requests",
  authMiddleware,
  superadminMiddleware,
  adminListArticleRequests as RequestHandler
);

/* =============== Teacher =============== */
ArticleRouter.get(
  "/teacher/articles",
  teacherAuthMiddleware,
  teacherListArticles as RequestHandler
);
ArticleRouter.get(
  "/teacher/articles/:id",
  teacherAuthMiddleware,
  teacherGetArticle as RequestHandler
);
ArticleRouter.post(
  "/teacher/articles/:id/like",
  teacherAuthMiddleware,
  teacherToggleLike as RequestHandler
);
ArticleRouter.get(
  "/teacher/articles/:id/comments",
  teacherAuthMiddleware,
  teacherListComments as RequestHandler
);
ArticleRouter.post(
  "/teacher/articles/:id/comments",
  teacherAuthMiddleware,
  teacherCreateComment as RequestHandler
);
ArticleRouter.post(
  "/teacher/article-requests",
  teacherAuthMiddleware,
  teacherCreateRequest as RequestHandler
);

export default ArticleRouter;
