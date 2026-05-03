import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { Request } from "express";

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDir(path.join(UPLOADS_ROOT, "articles"));
ensureDir(path.join(UPLOADS_ROOT, "profiles"));

function buildStorage(subdir: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(UPLOADS_ROOT, subdir);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".bin";
      cb(null, `${randomUUID()}${ext}`);
    },
  });
}

const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function imageFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED.has(ext) || !file.mimetype.startsWith("image/")) {
    return cb(new Error("Faqat rasm fayllari (jpg, png, webp, gif) qo'llab-quvvatlanadi"));
  }
  cb(null, true);
}

export const uploadArticleImage = multer({
  storage: buildStorage("articles"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("image");

export const uploadProfileImage = multer({
  storage: buildStorage("profiles"),
  fileFilter: imageFilter,
  limits: { fileSize: 3 * 1024 * 1024 },
}).single("image");

export function publicUrlFor(req: Request, subdir: string, filename: string): string {
  return `/uploads/${subdir}/${filename}`;
}
