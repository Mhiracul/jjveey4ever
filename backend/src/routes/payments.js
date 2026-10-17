import { Router } from "express";
import { randomUUID, timingSafeEqual } from "node:crypto";
import Gift from "../models/Gift.js";

const router = Router();
const allowedCurrencies = new Set(["NGN", "GBP"]);
const allowedKinds = new Set(["cash", "registry", "home"]);

function apiRoot() {
  return String(
    process.env.API_PUBLIC_URL || "https://jjveey4ever-backend.vercel.app/api",
  ).replace(/\/$/, "");
}
function clientRoot() {
  return String(
    process.env.CLIENT_PUBLIC_URL ||
      process.env.CLIENT_ORIGIN ||
      "https://jjveey4ever.vercel.app",
  ).replace(/\/$/, "");
}

async function verifyFlutterwaveTransaction(transactionId) {
  if (!process.env.FLW_SECRET_KEY)
    throw new Error(
      "Flutterwave is not configured. Add FLW_SECRET_KEY to backend/.env.",
    );
  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`,
    {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
    },
  );
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.status !== "success" || !result.data) {
    throw new Error("Flutterwave could not verify this transaction.");
  }
  return result.data;
}

async function reconcileTransaction(transactionId, txRef) {
  const gift = await Gift.findOne({ providerReference: txRef });
  if (!gift) return { ok: false, reason: "unknown_reference" };
  const transaction = await verifyFlutterwaveTransaction(transactionId);
  const correct =
    transaction.status === "successful" &&
    String(transaction.tx_ref) === String(gift.providerReference) &&
    String(transaction.currency).toUpperCase() === gift.currency &&
    Number(transaction.amount) >= Number(gift.amount);
  if (!correct) {
    if (gift.paymentStatus === "pending") {
      gift.paymentStatus = "failed";
      await gift.save();
    }
    return { ok: false, reason: "verification_mismatch" };
  }
  gift.paymentStatus = "paid";
  gift.provider = "flutterwave";
  gift.transactionId = String(transaction.id || transactionId);
  await gift.save();
  return { ok: true, gift };
}

router.post("/create", async (req, res, next) => {
  try {
    if (!process.env.FLW_SECRET_KEY) {
      return res.status(503).json({
        message:
          "Online payments are not enabled yet. The site administrator must add Flutterwave API credentials to backend/.env.",
      });
    }
    const donorName = String(req.body?.donorName || "").trim();
    const donorContact = String(req.body?.donorContact || "").trim();
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const itemName = String(req.body?.itemName || "Wedding gift")
      .trim()
      .slice(0, 120);
    const kind = String(req.body?.kind || "cash");
    const currency = String(req.body?.currency || "NGN").toUpperCase();
    const amount = Number(req.body?.amount);
    if (!donorName || !email || !/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({
        message: "Please provide your name and a valid email address.",
      });
    if (!allowedKinds.has(kind) || !allowedCurrencies.has(currency))
      return res
        .status(400)
        .json({ message: "Unsupported gift type or currency." });
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000)
      return res.status(400).json({ message: "Enter a valid gift amount." });
    if (
      (currency === "NGN" && amount < 1000) ||
      (currency === "GBP" && amount < 1)
    )
      return res
        .status(400)
        .json({ message: "The minimum gift is ₦1,000 or £1." });

    const txRef = `JV26-${randomUUID()}`;
    const gift = await Gift.create({
      donorName,
      donorContact,
      donorEmail: email,
      kind,
      itemName,
      amount,
      currency,
      paymentStatus: "pending",
      provider: "flutterwave",
      providerReference: txRef,
    });
    const payload = {
      tx_ref: txRef,
      amount,
      currency,
      redirect_url: `${apiRoot()}/payments/callback`,
      payment_options:
        currency === "NGN"
          ? "card, ussd, banktransfer, account"
          : "card, account",
      customer: {
        email,
        name: donorName,
        phonenumber: donorContact || undefined,
      },
      customizations: {
        title: "Jennifer & Vincent Wedding",
        description: `Wedding gift: ${itemName}`,
        logo: "",
      },
      meta: { giftId: String(gift._id), kind, itemName },
    };
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.status !== "success" || !result.data?.link) {
      gift.paymentStatus = "failed";
      await gift.save();
      return res.status(502).json({
        message:
          result.message || "Could not start checkout. Please try again later.",
      });
    }
    res.status(201).json({ checkoutUrl: result.data.link, reference: txRef });
  } catch (error) {
    next(error);
  }
});

router.get("/callback", async (req, res) => {
  const status = String(req.query.status || "").toLowerCase();
  const txRef = String(req.query.tx_ref || "");
  const transactionId = String(req.query.transaction_id || "");

  try {
    // Flutterwave may return "completed" before verification.
    // Always verify the transaction with Flutterwave's API.
    if (
      ["successful", "completed"].includes(status) &&
      txRef &&
      transactionId
    ) {
      const result = await reconcileTransaction(transactionId, txRef);

      return res.redirect(
        `${clientRoot()}/?payment=${result.ok ? "success" : "failed"}#gifts`,
      );
    }

    if (txRef) {
      await Gift.updateOne(
        {
          providerReference: txRef,
          paymentStatus: "pending",
        },
        {
          $set: { paymentStatus: "failed" },
        },
      );
    }

    return res.redirect(`${clientRoot()}/?payment=failed#gifts`);
  } catch (error) {
    console.error("Payment callback verification failed:", error.message);

    return res.redirect(`${clientRoot()}/?payment=verify#gifts`);
  }
});

router.post("/webhook", async (req, res) => {
  const expected = String(process.env.FLW_SECRET_HASH || "");
  const received = String(req.headers["verif-hash"] || "");
  if (!expected || !received)
    return res.status(401).send("Invalid webhook signature");
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  if (a.length !== b.length || !timingSafeEqual(a, b))
    return res.status(401).send("Invalid webhook signature");
  const transactionId = req.body?.data?.id;
  const txRef = req.body?.data?.tx_ref;
  if (req.body?.event === "charge.completed" && transactionId && txRef) {
    try {
      await reconcileTransaction(transactionId, txRef);
    } catch (error) {
      console.error("Payment webhook verification failed:", error.message);
      return res.status(500).send("Verification failed");
    }
  }
  return res.status(200).send("Webhook received");
});

export default router;
