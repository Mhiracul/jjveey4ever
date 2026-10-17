import mongoose from "mongoose";

const registryItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 500, default: "" },
  naira: { type: Number, min: 0, default: 0 },
  pounds: { type: Number, min: 0, default: 0 },
  imageUrl: { type: String, default: "" },
  active: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("RegistryItem", registryItemSchema);
