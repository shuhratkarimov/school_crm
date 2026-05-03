import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.config";

/* ================= Article ================= */
interface ArticleAttributes {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  cover_image: string | null;
  video_url: string | null;
  category: string;
  published: boolean;
  views: number;
  author_id: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface ArticleCreationAttributes
  extends Optional<ArticleAttributes, "id" | "summary" | "cover_image" | "video_url" | "category" | "published" | "views" | "author_id"> {}

export class Article extends Model<ArticleAttributes, ArticleCreationAttributes>
  implements ArticleAttributes {
  public id!: string;
  public title!: string;
  public summary!: string | null;
  public content!: string;
  public cover_image!: string | null;
  public video_url!: string | null;
  public category!: string;
  public published!: boolean;
  public views!: number;
  public author_id!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Article.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: { type: DataTypes.STRING(500), allowNull: false },
    summary: { type: DataTypes.STRING(1000), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    cover_image: { type: DataTypes.TEXT, allowNull: true },
    video_url: { type: DataTypes.STRING(1000), allowNull: true },
    category: { type: DataTypes.STRING(100), allowNull: false, defaultValue: "metodika" },
    published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    views: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    author_id: { type: DataTypes.UUID, allowNull: true },
  },
  {
    sequelize,
    tableName: "articles",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

/* ================= ArticleLike ================= */
interface ArticleLikeAttributes {
  id: string;
  article_id: string;
  teacher_id: string;
  created_at?: Date;
}
interface ArticleLikeCreation extends Optional<ArticleLikeAttributes, "id"> {}

export class ArticleLike extends Model<ArticleLikeAttributes, ArticleLikeCreation>
  implements ArticleLikeAttributes {
  public id!: string;
  public article_id!: string;
  public teacher_id!: string;
  public readonly created_at!: Date;
}

ArticleLike.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    article_id: { type: DataTypes.UUID, allowNull: false },
    teacher_id: { type: DataTypes.UUID, allowNull: false },
  },
  {
    sequelize,
    tableName: "article_likes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [{ unique: true, fields: ["article_id", "teacher_id"] }],
  }
);

/* ================= ArticleComment ================= */
interface ArticleCommentAttributes {
  id: string;
  article_id: string;
  teacher_id: string;
  text: string;
  created_at?: Date;
}
interface ArticleCommentCreation extends Optional<ArticleCommentAttributes, "id"> {}

export class ArticleComment extends Model<ArticleCommentAttributes, ArticleCommentCreation>
  implements ArticleCommentAttributes {
  public id!: string;
  public article_id!: string;
  public teacher_id!: string;
  public text!: string;
  public readonly created_at!: Date;
}

ArticleComment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    article_id: { type: DataTypes.UUID, allowNull: false },
    teacher_id: { type: DataTypes.UUID, allowNull: false },
    text: { type: DataTypes.TEXT, allowNull: false },
  },
  {
    sequelize,
    tableName: "article_comments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

/* ================= ArticleRequest ================= */
interface ArticleRequestAttributes {
  id: string;
  teacher_id: string;
  message: string;
  resolved: boolean;
  created_at?: Date;
}
interface ArticleRequestCreation
  extends Optional<ArticleRequestAttributes, "id" | "resolved"> {}

export class ArticleRequest extends Model<ArticleRequestAttributes, ArticleRequestCreation>
  implements ArticleRequestAttributes {
  public id!: string;
  public teacher_id!: string;
  public message!: string;
  public resolved!: boolean;
  public readonly created_at!: Date;
}

ArticleRequest.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    teacher_id: { type: DataTypes.UUID, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    resolved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    sequelize,
    tableName: "article_requests",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

export default Article;
