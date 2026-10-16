import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import GalleryImage from "../models/GalleryImage.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();
const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const uploadDir = path.join(backendDir, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const allowedMime = new Map([["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"], ["image/avif", ".avif"]]);
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${randomUUID()}${allowedMime.get(file.mimetype) || ".img"}`),
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => allowedMime.has(file.mimetype) ? cb(null, true) : cb(new Error("Upload a JPG, PNG, WebP, or AVIF image.")),
});

function publicUrl(req, file) {
  const base = String(process.env.API_PUBLIC_URL || `${req.protocol}://${req.get("host")}/api`).replace(/\/api\/?$/, "").replace(/\/$/, "");
  return `${base}/uploads/${file.filename}`;
}

router.get("/gallery", async (_req, res, next) => {
  try { res.json({ images: await GalleryImage.find().sort({ sortOrder: 1, createdAt: -1 }).lean() }); }
  catch (error) { next(error); }
});

router.post("/media/upload", requireAdmin, upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Choose an image to upload." });
    const imageUrl = publicUrl(req, req.file);
    const category = String(req.body?.category || "gallery");
    if (category === "gallery") {
      const image = await GalleryImage.create({ imageUrl, alt: String(req.body?.alt || "Jennifer and Vincent wedding photograph").slice(0, 180), caption: String(req.body?.caption || "").slice(0, 240) });
      return res.status(201).json({ image, imageUrl });
    }
    res.status(201).json({ imageUrl, filename: req.file.filename });
  } catch (error) { next(error); }
});

router.delete("/gallery/:id", requireAdmin, async (req, res, next) => {
  try {
    const image = await GalleryImage.findByIdAndDelete(req.params.id);
    if (!image) return res.status(404).json({ message: "Gallery image not found." });
    try {
      const url = new URL(image.imageUrl);
      const filename = path.basename(url.pathname);
      const file = path.join(uploadDir, filename);
      if (file.startsWith(uploadDir)) fs.rmSync(file, { force: true });
    } catch { /* Image may be stored remotely; deleting the database record is sufficient. */ }
    res.json({ message: "Gallery image deleted." });
  } catch (error) { next(error); }
});

export default router;
