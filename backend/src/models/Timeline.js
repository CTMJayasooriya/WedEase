import mongoose from "mongoose";

const timelineSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [150, "Event title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    eventDate: {
      type: Date,
      required: [true, "Event date is required"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      trim: true,
    },
    endTime: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      enum: [
        "Preparation",
        "Ceremony",
        "Photography",
        "Reception",
        "Food and Catering",
        "Entertainment",
        "Transportation",
        "Other",
      ],
      default: "Ceremony",
    },
    responsiblePerson: {
      type: String,
      trim: true,
      default: "",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Upcoming", "In Progress", "Completed", "Cancelled"],
      default: "Upcoming",
    },
    notes: {
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

const Timeline = mongoose.model("Timeline", timelineSchema);

export default Timeline;

