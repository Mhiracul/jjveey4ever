import { Router } from "express";
import RSVP from "../models/RSVP.js";
import Gift from "../models/Gift.js";
import RegistryItem from "../models/RegistryItem.js";

const router = Router();

router.get("/overview", async (_req, res, next) => {
  try {
    const [rsvpCount, accepted, declined, guestsAgg, giftsPending, giftsPaid, registryCount, revenueAgg] = await Promise.all([
      RSVP.countDocuments(), RSVP.countDocuments({ attendance: "yes" }), RSVP.countDocuments({ attendance: "no" }),
      RSVP.aggregate([{ $match: { attendance: "yes" } }, { $group: { _id: null, total: { $sum: "$guestCount" } } }]),
      Gift.countDocuments({ paymentStatus: "pending" }), Gift.countDocuments({ paymentStatus: "paid" }), RegistryItem.countDocuments({ active: true }),
      Gift.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: "$currency", total: { $sum: "$amount" }, count: { $sum: 1 } } }]),
    ]);
    const revenue = { NGN: 0, GBP: 0, count: 0 };
    for (const item of revenueAgg) { if (item._id in revenue) revenue[item._id] = item.total; revenue.count += item.count; }
    res.json({ stats: { rsvpCount, accepted, declined, expectedGuests: guestsAgg[0]?.total || 0, giftsPending, giftsPaid, registryCount, revenue } });
  } catch (error) { next(error); }
});

router.get("/rsvps", async (req, res, next) => {
  try {
    const { q = "", attendance, status } = req.query;
    const filter = {};
    if (["yes", "no"].includes(attendance)) filter.attendance = attendance;
    if (["new", "contacted", "confirmed", "declined"].includes(status)) filter.status = status;
    if (q) filter.$or = [{ guestName: { $regex: String(q).slice(0, 80), $options: "i" } }, { guestContact: { $regex: String(q).slice(0, 80), $options: "i" } }];
    const rsvps = await RSVP.find(filter).sort({ createdAt: -1 }).limit(500).lean();
    res.json({ rsvps });
  } catch (error) { next(error); }
});

router.patch("/rsvps/:id", async (req, res, next) => {
  try {
    const status = req.body?.status;
    if (!["new", "contacted", "confirmed", "declined"].includes(status)) return res.status(400).json({ message: "Invalid RSVP status." });
    const rsvp = await RSVP.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!rsvp) return res.status(404).json({ message: "RSVP not found." });
    res.json({ rsvp });
  } catch (error) { next(error); }
});

router.get("/gifts", async (_req, res, next) => {
  try { res.json({ gifts: await Gift.find().sort({ createdAt: -1 }).limit(500).lean() }); }
  catch (error) { next(error); }
});

router.patch("/gifts/:id/status", async (req, res, next) => {
  try {
    const paymentStatus = req.body?.paymentStatus;
    if (!["pending", "paid", "failed", "refunded"].includes(paymentStatus)) return res.status(400).json({ message: "Invalid payment status." });
    // Manual status changes are for reconciliation only. Real payment success must be verified by provider webhooks.
    const gift = await Gift.findByIdAndUpdate(req.params.id, { paymentStatus }, { new: true, runValidators: true });
    if (!gift) return res.status(404).json({ message: "Gift record not found." });
    res.json({ gift });
  } catch (error) { next(error); }
});

router.get("/registry", async (_req, res, next) => {
  try { res.json({ items: await RegistryItem.find().sort({ sortOrder: 1, name: 1 }).lean() }); }
  catch (error) { next(error); }
});

router.post("/registry", async (req, res, next) => {
  try {
    const { name, description = "", naira = 0, pounds = 0, imageUrl = "", active = true, sortOrder = 0 } = req.body || {};
    if (!String(name || "").trim()) return res.status(400).json({ message: "Registry item name is required." });
    const item = await RegistryItem.create({ name, description, naira: Number(naira), pounds: Number(pounds), imageUrl, active: Boolean(active), sortOrder: Number(sortOrder) });
    res.status(201).json({ item });
  } catch (error) { next(error); }
});

router.patch("/registry/:id", async (req, res, next) => {
  try {
    const allowed = ["name", "description", "naira", "pounds", "imageUrl", "active", "sortOrder"];
    const update = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => allowed.includes(key)));
    const item = await RegistryItem.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: "Registry item not found." });
    res.json({ item });
  } catch (error) { next(error); }
});

router.delete("/registry/:id", async (req, res, next) => {
  try {
    const item = await RegistryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Registry item not found." });
    res.json({ message: "Registry item deleted." });
  } catch (error) { next(error); }
});

export default router;
