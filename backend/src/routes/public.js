import { Router } from "express";
import RSVP from "../models/RSVP.js";
import RegistryItem from "../models/RegistryItem.js";

const router = Router();

router.post("/rsvps", async (req, res, next) => {
  try {
    const guestName = String(req.body?.guestName || "").trim();
    const guestContact = String(req.body?.guestContact || "").trim();
    const attendance = req.body?.attendance;
    const guestCount = Number(req.body?.guestCount || 1);
    const guestMessage = String(req.body?.guestMessage || "").trim();
    if (!guestName || !guestContact || !["yes", "no"].includes(attendance)) {
      return res.status(400).json({ message: "Please provide your name, contact, and attendance response." });
    }
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 6) {
      return res.status(400).json({ message: "Guest count must be between 1 and 6." });
    }
    const rsvp = await RSVP.create({ guestName, guestContact, attendance, guestCount: attendance === "no" ? 1 : guestCount, guestMessage });
    res.status(201).json({ message: "Thank you! Your RSVP has been received.", id: rsvp._id });
  } catch (error) { next(error); }
});

router.get("/registry", async (_req, res, next) => {
  try {
    const items = await RegistryItem.find({ active: true }).sort({ sortOrder: 1, name: 1 }).select("name description naira pounds imageUrl");
    res.json({ items });
  } catch (error) { next(error); }
});

export default router;
