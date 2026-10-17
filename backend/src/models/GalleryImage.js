import mongoose from "mongoose";

const galleryImageSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      default: "",
    },
    alt: {
      type: String,
      trim: true,
      maxlength: 180,
      default: "Jennifer and Vincent wedding photograph",
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 240,
      default: "",
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export default mongoose.model("GalleryImage", galleryImageSchema);
