import mongoose from "mongoose";

const weddingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One wedding profile per authenticated user
      index: true,
    },
    brideName: {
      type: String,
      required: [true, "Bride's name is required"],
      trim: true,
    },
    groomName: {
      type: String,
      required: [true, "Groom's name is required"],
      trim: true,
    },
    weddingDate: {
      type: Date,
      required: [true, "Wedding date is required"],
    },
    venue: {
      type: String,
      required: [true, "Wedding venue is required"],
      trim: true,
    },
    estimatedGuestCount: {
      type: Number,
      required: [true, "Estimated guest count is required"],
      min: [1, "Estimated guest count must be at least 1"],
    },
    totalBudget: {
      type: Number,
      required: [true, "Total wedding budget is required"],
      min: [0, "Total budget cannot be negative"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Wedding = mongoose.model("Wedding", weddingSchema);

export default Wedding;

