import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  maxAge: 8 * 60 * 60 * 1000,
  path: "/api/admin",
});

router.post("/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const expectedEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const expectedPassword = String(process.env.ADMIN_PASSWORD || "");
  if (!expectedEmail || (!expectedPassword && !process.env.ADMIN_PASSWORD_HASH) || !process.env.JWT_SECRET) {
    return res.status(503).json({ message: "Admin credentials are not configured on the server." });
  }
  // Compare password hashes if ADMIN_PASSWORD_HASH is configured; plain env password is a bootstrap fallback.
  const validPassword = process.env.ADMIN_PASSWORD_HASH
    ? await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH)
    : password === expectedPassword;
  if (email !== expectedEmail || !validPassword) return res.status(401).json({ message: "Email or password is incorrect." });
  const token = jwt.sign({ sub: email, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "8h" });
  res.cookie("adminToken", token, cookieOptions());
  res.json({ message: "Signed in", admin: { email } });
});

router.post("/logout", (_req, res) => {
  res.clearCookie("adminToken", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", path: "/api/admin" });
  res.json({ message: "Signed out" });
});

export default router;
