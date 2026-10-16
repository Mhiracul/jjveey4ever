import jwt from "jsonwebtoken";

export function requireAdmin(req, res, next) {
  const token = req.cookies?.adminToken || req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Admin authentication required." });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "admin") return res.status(403).json({ message: "Forbidden." });
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }
}
