import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import Wedding from "../models/Wedding.js";

// @desc    Create a new vendor booking
// @route   POST /api/bookings
// @access  Private (JWT required)
export const createBooking = async (req, res) => {
  try {
    const {
      vendorName,
      vendorCategory,
      contactPerson,
      phoneNumber,
      email,
      serviceDescription,
      bookingDate,
      eventDate,
      totalAmount,
      advanceAmount,
      bookingStatus,
      notes,
    } = req.body;

    if (!vendorName || !vendorName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vendor name is required.",
      });
    }

    if (totalAmount === undefined || isNaN(Number(totalAmount)) || Number(totalAmount) < 0) {
      return res.status(400).json({
        success: false,
        message: "Total amount must be a non-negative number.",
      });
    }

    const total = Number(totalAmount);
    const advance = advanceAmount !== undefined && !isNaN(Number(advanceAmount))
      ? Number(advanceAmount)
      : 0;

    if (advance < 0) {
      return res.status(400).json({
        success: false,
        message: "Advance amount cannot be negative.",
      });
    }

    if (advance > total) {
      return res.status(400).json({
        success: false,
        message: `Advance amount ($${advance}) cannot exceed total booking amount ($${total}).`,
      });
    }

    // Lookup linked wedding if present
    const wedding = await Wedding.findOne({ user: req.user._id });

    const booking = await Booking.create({
      vendorName: vendorName.trim(),
      vendorCategory: vendorCategory || "Other",
      contactPerson: contactPerson ? contactPerson.trim() : "",
      phoneNumber: phoneNumber ? phoneNumber.trim() : "",
      email: email ? email.trim().toLowerCase() : "",
      serviceDescription: serviceDescription ? serviceDescription.trim() : "",
      bookingDate: bookingDate ? new Date(bookingDate) : new Date(),
      eventDate: eventDate ? new Date(eventDate) : null,
      totalAmount: total,
      advanceAmount: advance,
      paidAmount: advance,
      remainingAmount: Math.max(0, total - advance),
      bookingStatus: bookingStatus || (advance > 0 ? "Confirmed" : "Pending"),
      notes: notes ? notes.trim() : "",
      wedding: wedding ? wedding._id : null,
      user: req.user._id,
    });

    // If an initial advance payment was paid upon booking, automatically log the payment record
    if (advance > 0) {
      await Payment.create({
        booking: booking._id,
        amount: advance,
        paymentDate: booking.bookingDate || new Date(),
        paymentMethod: "Bank Transfer",
        paymentType: "Advance",
        notes: "Initial advance deposit recorded upon booking creation",
        user: req.user._id,
      });
    }

    res.status(201).json({
      success: true,
      message: "Vendor booking created successfully!",
      booking,
    });
  } catch (error) {
    console.error("Create Booking Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create booking.",
      error: error.message,
    });
  }
};

// @desc    Get all bookings for the logged-in user with summary statistics
// @route   GET /api/bookings
// @access  Private (JWT required)
export const getBookings = async (req, res) => {
  try {
    const { vendorCategory, bookingStatus, search } = req.query;

    const filter = { user: req.user._id };

    if (vendorCategory && vendorCategory !== "All") {
      filter.vendorCategory = vendorCategory;
    }

    if (bookingStatus && bookingStatus !== "All") {
      filter.bookingStatus = bookingStatus;
    }

    if (search && search.trim()) {
      filter.$or = [
        { vendorName: { $regex: search.trim(), $options: "i" } },
        { contactPerson: { $regex: search.trim(), $options: "i" } },
        { serviceDescription: { $regex: search.trim(), $options: "i" } },
        { notes: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const bookings = await Booking.find(filter).sort({ eventDate: 1, createdAt: -1 });

    // Compute comprehensive statistics across ALL user bookings
    const allUserBookings = await Booking.find({ user: req.user._id });

    const totalBookings = allUserBookings.length;
    const confirmedBookings = allUserBookings.filter((b) => b.bookingStatus === "Confirmed").length;
    const pendingBookings = allUserBookings.filter((b) => b.bookingStatus === "Pending").length;
    const completedBookings = allUserBookings.filter((b) => b.bookingStatus === "Completed").length;
    const cancelledBookings = allUserBookings.filter((b) => b.bookingStatus === "Cancelled").length;

    const totalVendorCosts = allUserBookings.reduce(
      (sum, b) => (b.bookingStatus !== "Cancelled" ? sum + (Number(b.totalAmount) || 0) : sum),
      0
    );

    const totalPaid = allUserBookings.reduce(
      (sum, b) => (b.bookingStatus !== "Cancelled" ? sum + (Number(b.paidAmount) || 0) : sum),
      0
    );

    const outstandingPayments = Math.max(0, totalVendorCosts - totalPaid);

    res.status(200).json({
      success: true,
      count: bookings.length,
      stats: {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        completedBookings,
        cancelledBookings,
        totalVendorCosts,
        totalPaid,
        outstandingPayments,
      },
      bookings,
    });
  } catch (error) {
    console.error("Get Bookings Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve bookings.",
      error: error.message,
    });
  }
};

// @desc    Get booking details including payment history
// @route   GET /api/bookings/:id
// @access  Private (JWT required)
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
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
      booking,
      payments,
    });
  } catch (error) {
    console.error("Get Booking Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve booking details.",
      error: error.message,
    });
  }
};

// @desc    Update a booking
// @route   PUT /api/bookings/:id
// @access  Private (JWT required)
export const updateBooking = async (req, res) => {
  try {
    const {
      vendorName,
      vendorCategory,
      contactPerson,
      phoneNumber,
      email,
      serviceDescription,
      bookingDate,
      eventDate,
      totalAmount,
      bookingStatus,
      notes,
    } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or access denied.",
      });
    }

    if (totalAmount !== undefined) {
      const newTotal = Number(totalAmount);
      if (isNaN(newTotal) || newTotal < 0) {
        return res.status(400).json({
          success: false,
          message: "Total amount must be a non-negative number.",
        });
      }
      if (newTotal < booking.paidAmount) {
        return res.status(400).json({
          success: false,
          message: `Total amount ($${newTotal}) cannot be less than the amount already paid ($${booking.paidAmount}).`,
        });
      }
      booking.totalAmount = newTotal;
      booking.remainingAmount = Math.max(0, newTotal - booking.paidAmount);
    }

    if (vendorName !== undefined) booking.vendorName = vendorName.trim();
    if (vendorCategory !== undefined) booking.vendorCategory = vendorCategory;
    if (contactPerson !== undefined) booking.contactPerson = contactPerson.trim();
    if (phoneNumber !== undefined) booking.phoneNumber = phoneNumber.trim();
    if (email !== undefined) booking.email = email.trim().toLowerCase();
    if (serviceDescription !== undefined) booking.serviceDescription = serviceDescription.trim();
    if (bookingDate !== undefined) booking.bookingDate = bookingDate ? new Date(bookingDate) : booking.bookingDate;
    if (eventDate !== undefined) booking.eventDate = eventDate ? new Date(eventDate) : null;
    if (bookingStatus !== undefined) booking.bookingStatus = bookingStatus;
    if (notes !== undefined) booking.notes = notes.trim();

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking updated successfully!",
      booking,
    });
  } catch (error) {
    console.error("Update Booking Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update booking.",
      error: error.message,
    });
  }
};

// @desc    Delete a booking and associated payments
// @route   DELETE /api/bookings/:id
// @access  Private (JWT required)
export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or access denied.",
      });
    }

    // Cascade delete any payments linked to this booking
    await Payment.deleteMany({ booking: booking._id, user: req.user._id });

    res.status(200).json({
      success: true,
      message: "Booking and all associated payment records deleted successfully!",
    });
  } catch (error) {
    console.error("Delete Booking Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete booking.",
      error: error.message,
    });
  }
};

