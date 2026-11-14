import Guest from "../models/Guest.js";
import Wedding from "../models/Wedding.js";

// Helper to compute guest statistics for a user
const computeGuestStats = async (userId) => {
  const allGuests = await Guest.find({ user: userId });
  const wedding = await Wedding.findOne({ user: userId });

  const totalGuests = allGuests.length;
  const acceptedInvitations = allGuests.filter((g) => g.rsvpStatus === "Accepted").length;
  const declinedInvitations = allGuests.filter((g) => g.rsvpStatus === "Declined").length;
  const pendingResponses = allGuests.filter((g) => g.rsvpStatus === "Pending").length;

  const invitationsSent = allGuests.filter((g) => g.invitationStatus === "Sent").length;
  const invitationsNotSent = allGuests.filter((g) => g.invitationStatus === "Not Sent").length;

  // IMPORTANT: Calculate expected attendees using the number of attendees for accepted guests only!
  const totalExpectedAttendees = allGuests
    .filter((g) => g.rsvpStatus === "Accepted")
    .reduce((sum, g) => sum + (Number(g.numberOfAttendees) || 1), 0);

  const potentialTotalAttendees = allGuests.reduce(
    (sum, g) => sum + (Number(g.numberOfAttendees) || 1),
    0
  );

  const weddingTargetGuestCount = wedding ? Number(wedding.estimatedGuestCount) || 0 : 0;

  // Category breakdown
  const categoryMap = {
    Family: 0,
    Friends: 0,
    Relatives: 0,
    Colleagues: 0,
    Other: 0,
  };
  allGuests.forEach((g) => {
    const cat = g.guestCategory || "Other";
    if (categoryMap[cat] !== undefined) {
      categoryMap[cat] += 1;
    } else {
      categoryMap.Other += 1;
    }
  });

  return {
    totalGuests,
    acceptedInvitations,
    declinedInvitations,
    pendingResponses,
    invitationsSent,
    invitationsNotSent,
    totalExpectedAttendees,
    potentialTotalAttendees,
    weddingTargetGuestCount,
    categoryBreakdown: categoryMap,
  };
};

// @desc    Add a new guest
// @route   POST /api/guests
// @access  Private (JWT required)
export const createGuest = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      guestCategory,
      invitationStatus,
      rsvpStatus,
      numberOfAttendees,
      dietaryRequirements,
      specialNotes,
    } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Guest full name is required.",
      });
    }

    const attendees =
      numberOfAttendees !== undefined && !isNaN(Number(numberOfAttendees))
        ? Math.max(1, parseInt(numberOfAttendees, 10))
        : 1;

    // Lookup linked wedding if present
    const wedding = await Wedding.findOne({ user: req.user._id });

    const guest = await Guest.create({
      fullName: fullName.trim(),
      email: email ? email.trim().toLowerCase() : "",
      phoneNumber: phoneNumber ? phoneNumber.trim() : "",
      guestCategory: guestCategory || "Other",
      invitationStatus: invitationStatus || "Not Sent",
      rsvpStatus: rsvpStatus || "Pending",
      numberOfAttendees: attendees,
      dietaryRequirements: dietaryRequirements ? dietaryRequirements.trim() : "",
      specialNotes: specialNotes ? specialNotes.trim() : "",
      wedding: wedding ? wedding._id : null,
      user: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Guest added successfully!",
      guest,
    });
  } catch (error) {
    console.error("Create Guest Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to add guest.",
      error: error.message,
    });
  }
};

// @desc    Get all guests for authenticated user with filters & stats
// @route   GET /api/guests
// @access  Private (JWT required)
export const getGuests = async (req, res) => {
  try {
    const { guestCategory, rsvpStatus, invitationStatus, search } = req.query;

    const filter = { user: req.user._id };

    if (guestCategory && guestCategory !== "All") {
      filter.guestCategory = guestCategory;
    }

    if (rsvpStatus && rsvpStatus !== "All") {
      filter.rsvpStatus = rsvpStatus;
    }

    if (invitationStatus && invitationStatus !== "All") {
      filter.invitationStatus = invitationStatus;
    }

    if (search && search.trim()) {
      filter.$or = [
        { fullName: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
        { phoneNumber: { $regex: search.trim(), $options: "i" } },
        { dietaryRequirements: { $regex: search.trim(), $options: "i" } },
        { specialNotes: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const guests = await Guest.find(filter).sort({ createdAt: -1 });
    const stats = await computeGuestStats(req.user._id);

    res.status(200).json({
      success: true,
      count: guests.length,
      stats,
      guests,
    });
  } catch (error) {
    console.error("Get Guests Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve guests.",
      error: error.message,
    });
  }
};

// @desc    Get overall guest statistics
// @route   GET /api/guests/statistics
// @access  Private (JWT required)
export const getGuestStatistics = async (req, res) => {
  try {
    const stats = await computeGuestStats(req.user._id);

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get Guest Statistics Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve guest statistics.",
      error: error.message,
    });
  }
};

// @desc    Get a single guest by ID
// @route   GET /api/guests/:id
// @access  Private (JWT required)
export const getGuestById = async (req, res) => {
  try {
    const guest = await Guest.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found or access denied.",
      });
    }

    res.status(200).json({
      success: true,
      guest,
    });
  } catch (error) {
    console.error("Get Guest By ID Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve guest.",
      error: error.message,
    });
  }
};

// @desc    Update a guest
// @route   PUT /api/guests/:id
// @access  Private (JWT required)
export const updateGuest = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      guestCategory,
      invitationStatus,
      rsvpStatus,
      numberOfAttendees,
      dietaryRequirements,
      specialNotes,
    } = req.body;

    const guest = await Guest.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found or access denied.",
      });
    }

    if (fullName !== undefined) {
      if (!fullName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Guest full name cannot be empty.",
        });
      }
      guest.fullName = fullName.trim();
    }

    if (email !== undefined) guest.email = email.trim().toLowerCase();
    if (phoneNumber !== undefined) guest.phoneNumber = phoneNumber.trim();
    if (guestCategory !== undefined) guest.guestCategory = guestCategory;
    if (invitationStatus !== undefined) guest.invitationStatus = invitationStatus;
    if (rsvpStatus !== undefined) guest.rsvpStatus = rsvpStatus;

    if (numberOfAttendees !== undefined) {
      const attendees = parseInt(numberOfAttendees, 10);
      if (isNaN(attendees) || attendees < 1) {
        return res.status(400).json({
          success: false,
          message: "Number of attendees must be at least 1.",
        });
      }
      guest.numberOfAttendees = attendees;
    }

    if (dietaryRequirements !== undefined) guest.dietaryRequirements = dietaryRequirements.trim();
    if (specialNotes !== undefined) guest.specialNotes = specialNotes.trim();

    await guest.save();

    res.status(200).json({
      success: true,
      message: "Guest updated successfully!",
      guest,
    });
  } catch (error) {
    console.error("Update Guest Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update guest.",
      error: error.message,
    });
  }
};

// @desc    Delete a guest
// @route   DELETE /api/guests/:id
// @access  Private (JWT required)
export const deleteGuest = async (req, res) => {
  try {
    const guest = await Guest.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found or access denied.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Guest deleted successfully!",
    });
  } catch (error) {
    console.error("Delete Guest Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete guest.",
      error: error.message,
    });
  }
};
