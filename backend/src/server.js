import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";
import paymentRoutes from "./routes/payments.js";
import mediaRoutes from "./routes/media.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireAdmin } from "./middleware/auth.js";

const app = express();
const port = Number(process.env.PORT || 5001);

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "https://jjveey4ever.vercel.app",
    credentials: true,
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
const backendDir = path.dirname(fileURLToPath(import.meta.url));
app.use(
  "/uploads",
  express.static(path.join(backendDir, "../uploads"), {
    maxAge: "7d",
    immutable: true,
  }),
);
if (process.env.NODE_ENV !== "test") app.use(morgan("tiny"));
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, service: "jv-wedding-api" }),
);
app.use("/api/admin", authRoutes);
app.use("/api", publicRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api", mediaRoutes);
app.get("/api/admin/me", requireAdmin, (req, res) =>
  res.json({ admin: { email: req.admin.sub } }),
);
app.use("/api/admin", requireAdmin, adminRoutes);
app.use((req, res) => res.status(404).json({ message: "Route not found." }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error?.name === "MulterError")
    return res.status(400).json({
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "Image must be 8 MB or smaller."
          : "Image upload failed. Please choose one supported image file.",
    });
  if (error?.message?.startsWith("Upload a JPG"))
    return res.status(400).json({ message: error.message });
  if (error?.name === "ValidationError")
    return res
      .status(400)
      .json({ message: "Some submitted fields are invalid." });
  if (error?.name === "CastError")
    return res.status(400).json({ message: "Invalid record ID." });
  res.status(500).json({ message: "Something went wrong. Please try again." });
});

try {
  if (!process.env.MONGODB_URI)
    throw new Error(
      "MONGODB_URI is missing. Copy .env.example to .env and configure it.",
    );
  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(port, () =>
    console.log(`Wedding API listening on http://localhost:${port}`),
  );
} catch (error) {
  console.error("Unable to start API:", error.message);
  process.exit(1);
}
