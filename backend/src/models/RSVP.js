import mongoose from "mongoose";

const rsvpSchema = new mongoose.Schema({
  guestName: { type: String, required: true, trim: true, maxlength: 120 },
  guestContact: { type: String, required: true, trim: true, maxlength: 160 },
  attendance: { type: String, enum: ["yes", "no"], required: true },
  guestCount: { type: Number, min: 1, max: 6, default: 1 },
  guestMessage: { type: String, trim: true, maxlength: 1000, default: "" },
  status: { type: String, enum: ["new", "contacted", "confirmed", "declined"], default: "new" },
}, { timestamps: true });

rsvpSchema.index({ guestContact: 1 });
export default mongoose.model("RSVP", rsvpSchema);
