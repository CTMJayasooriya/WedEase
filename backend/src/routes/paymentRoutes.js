import express from "express";
import {
  recordPayment,
  getPaymentHistory,
  getPaymentsByBooking,
  deletePayment,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All payment routes require JWT authentication
router.post("/", protect, recordPayment);
router.get("/", protect, getPaymentHistory);
router.get("/booking/:bookingId", protect, getPaymentsByBooking);
router.delete("/:id", protect, deletePayment);

export default router;
