import Wedding from "../models/Wedding.js";

// @desc    Create wedding profile for the logged-in user
// @route   POST /api/weddings
// @access  Private (JWT required)
export const createWedding = async (req, res) => {
  try {
    const {
      brideName,
      groomName,
      weddingDate,
      venue,
      estimatedGuestCount,
      totalBudget,
      description,
    } = req.body;

    // Validate required fields
    if (
      !brideName ||
      !groomName ||
      !weddingDate ||
      !venue ||
      estimatedGuestCount === undefined ||
      totalBudget === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields (Bride's Name, Groom's Name, Wedding Date, Venue, Guest Count, and Total Budget).",
      });
    }

    // Check if user already has a wedding profile
    const existingWedding = await Wedding.findOne({ user: req.user._id });
    if (existingWedding) {
      return res.status(409).json({
        success: false,
        message: "A wedding profile already exists for your account. Please update your existing profile.",
        wedding: existingWedding,
      });
    }

    const wedding = await Wedding.create({
      user: req.user._id,
      brideName: brideName.trim(),
      groomName: groomName.trim(),
      weddingDate: new Date(weddingDate),
      venue: venue.trim(),
      estimatedGuestCount: Number(estimatedGuestCount),
      totalBudget: Number(totalBudget),
      description: description ? description.trim() : "",
    });

    res.status(201).json({
      success: true,
      message: "Wedding profile created successfully!",
      wedding,
    });
  } catch (error) {
    console.error("Create Wedding Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create wedding profile.",
      error: error.message,
    });
  }
};

// @desc    Get wedding profile for the logged-in user
// @route   GET /api/weddings/my-wedding
// @access  Private (JWT required)
export const getMyWedding = async (req, res) => {
  try {
    const wedding = await Wedding.findOne({ user: req.user._id });

    if (!wedding) {
      return res.status(404).json({
        success: false,
        message: "No wedding profile found for this account.",
        wedding: null,
      });
    }

    res.status(200).json({
      success: true,
      wedding,
    });
  } catch (error) {
    console.error("Get Wedding Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve wedding details.",
      error: error.message,
    });
  }
};

// @desc    Update (or upsert) wedding profile for the logged-in user
// @route   PUT /api/weddings/my-wedding
// @access  Private (JWT required)
export const updateMyWedding = async (req, res) => {
  try {
    const {
      brideName,
      groomName,
      weddingDate,
      venue,
      estimatedGuestCount,
      totalBudget,
      description,
    } = req.body;

    // Validate required fields
    if (
      !brideName ||
      !groomName ||
      !weddingDate ||
      !venue ||
      estimatedGuestCount === undefined ||
      totalBudget === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields (Bride's Name, Groom's Name, Wedding Date, Venue, Guest Count, and Total Budget).",
      });
    }

    const updateData = {
      brideName: brideName.trim(),
      groomName: groomName.trim(),
      weddingDate: new Date(weddingDate),
      venue: venue.trim(),
      estimatedGuestCount: Number(estimatedGuestCount),
      totalBudget: Number(totalBudget),
      description: description ? description.trim() : "",
    };

    // Find and update; if not found, upsert a new wedding profile for this user
    let wedding = await Wedding.findOneAndUpdate(
      { user: req.user._id },
      { $set: updateData },
      { new: true, runValidators: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Wedding profile saved successfully!",
      wedding,
    });
  } catch (error) {
    console.error("Update Wedding Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to save wedding details.",
      error: error.message,
    });
  }
};

