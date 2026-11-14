import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    vendorName: {
      type: String,
      required: [true, "Vendor name is required"],
      trim: true,
      maxlength: [150, "Vendor name cannot exceed 150 characters"],
    },
    vendorCategory: {
      type: String,
      required: [true, "Vendor category is required"],
      enum: [
        "Wedding Venue",
        "Catering",
        "Photography",
        "Videography",
        "Decoration",
        "Wedding Dress",
        "Makeup Artist",
        "Music and Entertainment",
        "Transportation",
        "Other",
      ],
      default: "Other",
    },
    contactPerson: {
      type: String,
      trim: true,
      default: "",
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    serviceDescription: {
      type: String,
      trim: true,
      default: "",
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    eventDate: {
      type: Date,
      default: null,
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    advanceAmount: {
      type: Number,
      default: 0,
      min: [0, "Advance amount cannot be negative"],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: [0, "Remaining amount cannot be negative"],
    },
    bookingStatus: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled", "Completed"],
      default: "Pending",
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

// Pre-save hook: Ensure remainingAmount is correctly calculated
bookingSchema.pre("save", function () {
  if (this.totalAmount !== undefined && this.paidAmount !== undefined) {
    this.remainingAmount = Math.max(0, this.totalAmount - this.paidAmount);
  }
});

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
