import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";

// @desc    Record a new payment for a vendor booking
// @route   POST /api/payments
// @access  Private (JWT required)
export const recordPayment = async (req, res) => {
  try {
    const { bookingId, amount, paymentDate, paymentMethod, paymentType, notes } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required.",
      });
    }

    if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than zero.",
      });
    }

    const payAmount = Number(amount);

    // Verify booking belongs to authenticated user
    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Vendor booking not found or access denied.",
      });
    }

    // Overpayment protection
    if (payAmount > booking.remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount ($${payAmount.toLocaleString()}) exceeds the remaining balance ($${booking.remainingAmount.toLocaleString()}).`,
      });
    }

    // Create payment record
    const payment = await Payment.create({
      booking: booking._id,
      amount: payAmount,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod: paymentMethod || "Bank Transfer",
      paymentType: paymentType || (payAmount >= booking.remainingAmount ? "Final" : "Partial"),
      notes: notes ? notes.trim() : "",
      user: req.user._id,
    });

    // Update booking balance
    booking.paidAmount += payAmount;
    booking.remainingAmount = Math.max(0, booking.totalAmount - booking.paidAmount);

    // If fully paid, ensure status reflects confirmed
    if (booking.remainingAmount === 0 && booking.bookingStatus === "Pending") {
      booking.bookingStatus = "Confirmed";
    }

    await booking.save();

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully!",
      payment,
      updatedBooking: booking,
    });
  } catch (error) {
    console.error("Record Payment Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to record payment.",
      error: error.message,
    });
  }
};

// @desc    Get user's full payment history
// @route   GET /api/payments
// @access  Private (JWT required)
export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate("booking", "vendorName vendorCategory totalAmount")
      .sort({ paymentDate: -1, createdAt: -1 });

    const totalPaidSum = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    res.status(200).json({
      success: true,
      count: payments.length,
      totalPaidSum,
      payments,
    });
  } catch (error) {
    console.error("Get Payment History Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve payment history.",
      error: error.message,
    });
  }
};

// @desc    Get all payments for a specific booking
// @route   GET /api/payments/booking/:bookingId
// @access  Private (JWT required)
export const getPaymentsByBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      user: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or access denied.",
      });
    }

    const payments = await Payment.find({
      booking: booking._id,
      user: req.user._id,
    }).sort({ paymentDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      booking,
      payments,
    });
  } catch (error) {
    console.error("Get Payments By Booking Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve payments for this booking.",
      error: error.message,
    });
  }
};

// @desc    Delete a payment and restore booking balance
// @route   DELETE /api/payments/:id
// @access  Private (JWT required)
export const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found or access denied.",
      });
    }

    // Find and update the associated booking balance
    const booking = await Booking.findOne({
      _id: payment.booking,
      user: req.user._id,
    });

    if (booking) {
      booking.paidAmount = Math.max(0, booking.paidAmount - payment.amount);
      booking.remainingAmount = Math.max(0, booking.totalAmount - booking.paidAmount);
      await booking.save();
    }

    res.status(200).json({
      success: true,
      message: "Payment deleted and booking balance restored successfully!",
      updatedBooking: booking,
    });
  } catch (error) {
    console.error("Delete Payment Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete payment.",
      error: error.message,
    });
  }
};

