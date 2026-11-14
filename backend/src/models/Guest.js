import mongoose from "mongoose";

const guestSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Guest full name is required"],
      trim: true,
      maxlength: [150, "Full name cannot exceed 150 characters"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },
    guestCategory: {
      type: String,
      enum: ["Family", "Friends", "Relatives", "Colleagues", "Other"],
      default: "Other",
    },
    invitationStatus: {
      type: String,
      enum: ["Not Sent", "Sent"],
      default: "Not Sent",
    },
    rsvpStatus: {
      type: String,
      enum: ["Pending", "Accepted", "Declined"],
      default: "Pending",
    },
    numberOfAttendees: {
      type: Number,
      required: [true, "Number of attendees is required"],
      min: [1, "Number of attendees must be at least 1"],
      default: 1,
    },
    dietaryRequirements: {
      type: String,
      trim: true,
      default: "",
    },
    specialNotes: {
      type: String,
      trim: true,
      default: "",
    },
    wedding: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wedding",
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Guest = mongoose.model("Guest", guestSchema);

export default Guest;
