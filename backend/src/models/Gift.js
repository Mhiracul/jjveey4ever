import mongoose from "mongoose";

const giftSchema = new mongoose.Schema(
  {
    donorName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "A well-wisher",
    },
    donorContact: { type: String, trim: true, maxlength: 160, default: "" },
    donorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 180,
      default: "",
    },
    kind: { type: String, enum: ["cash", "registry", "home"], required: true },
    itemName: { type: String, trim: true, maxlength: 120, default: "" },
    amount: { type: Number, min: 0, required: true },
    currency: { type: String, enum: ["NGN", "GBP"], required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    provider: { type: String, default: "" },
    providerReference: { type: String, unique: true, sparse: true },
    transactionId: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("Gift", giftSchema);
