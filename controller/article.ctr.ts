import { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";
import { Article, ArticleLike, ArticleComment, ArticleRequest, Teacher } from "../Models";
import { BaseError } from "../Utils/base_error";

// POST /admin/articles/upload-image  — multer.single("image") handles upload
export const adminUploadArticleImage = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return next(BaseError.BadRequest(400, "Rasm yuborilmadi"));
    const url = `/uploads/articles/${req.file.filename}`;
    res.status(201).json({ url });
  } catch (err) {
    next(err);
  }
};

/* ===================== ADMIN (superadmin) ===================== */

// GET /admin/articles
export const adminListArticles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const articles = await Article.findAll({
      order: [["created_at", "DESC"]],
      attributes: { exclude: ["content"] },
    });

    const ids = articles.map((a) => a.id);
    const [likes, comments] = await Promise.all([
      ArticleLike.findAll({ where: { article_id: { [Op.in]: ids } } }),
      ArticleComment.findAll({ where: { article_id: { [Op.in]: ids } } }),
    ]);

    const likeMap = new Map<string, number>();
    likes.forEach((l) => likeMap.set(l.article_id, (likeMap.get(l.article_id) || 0) + 1));
    const commentMap = new Map<string, number>();
    comments.forEach((c) => commentMap.set(c.article_id, (commentMap.get(c.article_id) || 0) + 1));

    const data = articles.map((a) => ({
      ...a.toJSON(),
      likes_count: likeMap.get(a.id) || 0,
      comments_count: commentMap.get(a.id) || 0,
    }));

    res.json({ articles: data });
  } catch (err) {
    next(err);
  }
};

// GET /admin/articles/:id  — full article incl. content
export const adminGetArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const article = await Article.findByPk(id);
    if (!article) return next(BaseError.BadRequest(404, "Maqola topilmadi"));
    res.json({ article });
  } catch (err) {
    next(err);
  }
};

// POST /admin/articles
export const adminCreateArticle = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { title, summary, content, cover_image, video_url, category, published } = req.body;
    if (!title || !content) {
      return next(BaseError.BadRequest(400, "title va content majburiy"));
    }
    const article = await Article.create({
      title,
      summary: summary ?? null,
      content,
      cover_image: cover_image ?? null,
      video_url: video_url ?? null,
      category: category || "metodika",
      published: published ?? true,
      author_id: req.user?.id ?? null,
    });
    res.status(201).json({ article });
  } catch (err) {
    next(err);
  }
};

// PUT /admin/articles/:id
export const adminUpdateArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const article = await Article.findByPk(id);
    if (!article) return next(BaseError.BadRequest(404, "Maqola topilmadi"));

    const { title, summary, content, cover_image, video_url, category, published } = req.body;
    await article.update({
      ...(title !== undefined && { title }),
      ...(summary !== undefined && { summary }),
      ...(content !== undefined && { content }),
      ...(cover_image !== undefined && { cover_image }),
      ...(video_url !== undefined && { video_url }),
      ...(category !== undefined && { category }),
      ...(published !== undefined && { published }),
    });
    res.json({ article });
  } catch (err) {
    next(err);
  }
};

// DELETE /admin/articles/:id
export const adminDeleteArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const article = await Article.findByPk(id);
    if (!article) return next(BaseError.BadRequest(404, "Maqola topilmadi"));
    await article.destroy();
    res.json({ message: "Maqola o'chirildi" });
  } catch (err) {
    next(err);
  }
};

// GET /admin/article-requests
export const adminListArticleRequests = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await ArticleRequest.findAll({
      order: [["created_at", "DESC"]],
      include: [
        {
          model: Teacher,
          as: "teacher",
          attributes: ["id", "first_name", "last_name"],
        },
      ],
    });

    const data = requests.map((r) => {
      const t: any = (r as any).teacher;
      return {
        ...r.toJSON(),
        teacher_name: t ? `${t.first_name} ${t.last_name}`.trim() : "Anonim ustoz",
      };
    });

    res.json({ requests: data });
  } catch (err) {
    next(err);
  }
};

/* ===================== TEACHER ===================== */

// GET /teacher/articles
export const teacherListArticles = async (req: any, res: Response, next: NextFunction) => {
  try {
    const teacher_id = req.teacher?.id;
    const articles = await Article.findAll({
      where: { published: true },
      order: [["created_at", "DESC"]],
      attributes: { exclude: ["content"] },
    });

    const ids = articles.map((a) => a.id);
    const [likes, comments, myLikes] = await Promise.all([
      ArticleLike.findAll({ where: { article_id: { [Op.in]: ids } } }),
      ArticleComment.findAll({ where: { article_id: { [Op.in]: ids } } }),
      teacher_id
        ? ArticleLike.findAll({ where: { article_id: { [Op.in]: ids }, teacher_id } })
        : Promise.resolve([] as ArticleLike[]),
    ]);

    const likeMap = new Map<string, number>();
    likes.forEach((l) => likeMap.set(l.article_id, (likeMap.get(l.article_id) || 0) + 1));
    const commentMap = new Map<string, number>();
    comments.forEach((c) => commentMap.set(c.article_id, (commentMap.get(c.article_id) || 0) + 1));
    const mySet = new Set(myLikes.map((l) => l.article_id));

    const data = articles.map((a) => ({
      ...a.toJSON(),
      likes_count: likeMap.get(a.id) || 0,
      comments_count: commentMap.get(a.id) || 0,
      liked_by_me: mySet.has(a.id),
    }));

    res.json({ articles: data });
  } catch (err) {
    next(err);
  }
};

// GET /teacher/articles/:id  — increments views
export const teacherGetArticle = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const teacher_id = req.teacher?.id;
    const article = await Article.findOne({ where: { id, published: true } });
    if (!article) return next(BaseError.BadRequest(404, "Maqola topilmadi"));

    await article.increment("views", { by: 1 });
    await article.reload();

    const [likesCount, commentsCount, myLike] = await Promise.all([
      ArticleLike.count({ where: { article_id: id } }),
      ArticleComment.count({ where: { article_id: id } }),
      teacher_id ? ArticleLike.findOne({ where: { article_id: id, teacher_id } }) : null,
    ]);

    res.json({
      article: {
        ...article.toJSON(),
        likes_count: likesCount,
        comments_count: commentsCount,
        liked_by_me: !!myLike,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /teacher/articles/:id/like  — toggle
export const teacherToggleLike = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const teacher_id = req.teacher?.id;
    if (!teacher_id) return next(BaseError.BadRequest(401, "Auth required"));

    const article = await Article.findOne({ where: { id, published: true } });
    if (!article) return next(BaseError.BadRequest(404, "Maqola topilmadi"));

    const existing = await ArticleLike.findOne({ where: { article_id: id, teacher_id } });
    let liked: boolean;
    if (existing) {
      await existing.destroy();
      liked = false;
    } else {
      await ArticleLike.create({ article_id: id, teacher_id });
      liked = true;
    }

    const likes_count = await ArticleLike.count({ where: { article_id: id } });
    res.json({ liked, likes_count });
  } catch (err) {
    next(err);
  }
};

// GET /teacher/articles/:id/comments
export const teacherListComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const comments = await ArticleComment.findAll({
      where: { article_id: id },
      order: [["created_at", "DESC"]],
      include: [
        {
          model: Teacher,
          as: "teacher",
          attributes: ["id", "first_name", "last_name", "img_url"],
        },
      ],
    });

    const data = comments.map((c) => {
      const t: any = (c as any).teacher;
      return {
        id: c.id,
        text: c.text,
        created_at: c.created_at,
        author_name: t ? `${t.first_name} ${t.last_name}`.trim() : "Ustoz",
        author_img: t?.img_url || null,
      };
    });

    res.json({ comments: data });
  } catch (err) {
    next(err);
  }
};

// POST /teacher/articles/:id/comments
export const teacherCreateComment = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const teacher_id = req.teacher?.id;
    if (!teacher_id) return next(BaseError.BadRequest(401, "Auth required"));

    const text = (req.body?.text || "").trim();
    if (!text) return next(BaseError.BadRequest(400, "text bo'sh"));

    const article = await Article.findOne({ where: { id, published: true } });
    if (!article) return next(BaseError.BadRequest(404, "Maqola topilmadi"));

    const c = await ArticleComment.create({ article_id: id, teacher_id, text });

    const teacher = await Teacher.findByPk(teacher_id);
    res.status(201).json({
      comment: {
        id: c.id,
        text: c.text,
        created_at: c.created_at,
        author_name: teacher
          ? `${(teacher as any).first_name} ${(teacher as any).last_name}`.trim()
          : "Ustoz",
        author_img: (teacher as any)?.img_url || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /teacher/article-requests
export const teacherCreateRequest = async (req: any, res: Response, next: NextFunction) => {
  try {
    const teacher_id = req.teacher?.id;
    if (!teacher_id) return next(BaseError.BadRequest(401, "Auth required"));

    const message = (req.body?.message || "").trim();
    if (!message) return next(BaseError.BadRequest(400, "message bo'sh"));
    if (message.length < 10) {
      return next(BaseError.BadRequest(400, "So'rov kamida 10 ta belgidan iborat bo'lsin"));
    }

    const r = await ArticleRequest.create({ teacher_id, message });
    res.status(201).json({ request: r });
  } catch (err) {
    next(err);
  }
};
