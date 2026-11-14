import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Expense title is required"],
      trim: true,
      maxlength: [150, "Expense title cannot exceed 150 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      enum: [
        "Venue",
        "Catering",
        "Photography",
        "Videography",
        "Decorations",
        "Wedding Attire",
        "Invitations",
        "Transportation",
        "Entertainment",
        "Other",
      ],
      default: "Other",
    },
    estimatedAmount: {
      type: Number,
      required: [true, "Estimated amount is required"],
      min: [0, "Estimated amount cannot be negative"],
    },
    actualAmount: {
      type: Number,
      default: 0,
      min: [0, "Actual amount cannot be negative"],
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Partially Paid", "Paid"],
      default: "Unpaid",
    },
    paymentDate: {
      type: Date,
      default: null,
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

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
