import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import GalleryImage from "../models/GalleryImage.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const allowedMime = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMime.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Upload a JPG, PNG, WebP, or AVIF image."));
    }
  },
});

function uploadToCloudinary(file, category) {
  return new Promise((resolve, reject) => {
    const folder =
      category === "gallery" ? "jveey4eva26/gallery" : "jveey4eva26/uploads";

    const publicId = `${Date.now()}-${randomUUID()}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
        transformation: [
          { width: 2400, height: 2400, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) {
          return reject(new Error("Cloudinary did not return an image."));
        }
        resolve(result);
      },
    );

    stream.end(file.buffer);
  });
}

router.get("/gallery", async (_req, res, next) => {
  try {
    const images = await GalleryImage.find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    res.json({ images });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/media/upload",
  requireAdmin,
  upload.single("image"),
  async (req, res, next) => {
    let uploadedAsset;

    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Choose an image to upload.",
        });
      }

      if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
      ) {
        return res.status(500).json({
          message: "Cloudinary is not configured on the server.",
        });
      }

      const category = String(req.body?.category || "gallery");
      uploadedAsset = await uploadToCloudinary(req.file, category);

      const imageUrl = uploadedAsset.secure_url;

      if (category === "gallery") {
        try {
          const image = await GalleryImage.create({
            imageUrl,
            cloudinaryPublicId: uploadedAsset.public_id,
            alt: String(
              req.body?.alt || "Jennifer and Vincent wedding photograph",
            ).slice(0, 180),
            caption: String(req.body?.caption || "").slice(0, 240),
          });

          return res.status(201).json({ image, imageUrl });
        } catch (databaseError) {
          // Avoid leaving an orphaned Cloudinary image if MongoDB fails.
          await cloudinary.uploader
            .destroy(uploadedAsset.public_id)
            .catch(() => {});

          throw databaseError;
        }
      }
      return res.status(201).json({
        imageUrl,
        cloudinaryPublicId: uploadedAsset.public_id,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.delete("/gallery/:id", requireAdmin, async (req, res, next) => {
  try {
    const image = await GalleryImage.findById(req.params.id);

    if (!image) {
      return res.status(404).json({
        message: "Gallery image not found.",
      });
    }

    // Remove the cloud asset before removing its database record.
    if (image.cloudinaryPublicId) {
      const result = await cloudinary.uploader.destroy(
        image.cloudinaryPublicId,
        { resource_type: "image", invalidate: true },
      );

      if (result.result !== "ok" && result.result !== "not found") {
        return res.status(502).json({
          message: "The image could not be deleted from Cloudinary.",
        });
      }
    }

    await image.deleteOne();

    res.json({ message: "Gallery image deleted." });
  } catch (error) {
    next(error);
  }
});

export default router;
