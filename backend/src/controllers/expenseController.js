import Expense from "../models/Expense.js";
import Wedding from "../models/Wedding.js";
import Booking from "../models/Booking.js";

// @desc    Add a new expense
// @route   POST /api/expenses
// @access  Private (JWT required)
export const createExpense = async (req, res) => {
  try {
    const {
      title,
      category,
      estimatedAmount,
      actualAmount,
      paymentStatus,
      paymentDate,
      notes,
    } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Expense title is required.",
      });
    }

    if (estimatedAmount === undefined || isNaN(Number(estimatedAmount)) || Number(estimatedAmount) < 0) {
      return res.status(400).json({
        success: false,
        message: "Estimated amount must be a non-negative number.",
      });
    }

    if (actualAmount !== undefined && (isNaN(Number(actualAmount)) || Number(actualAmount) < 0)) {
      return res.status(400).json({
        success: false,
        message: "Actual amount cannot be negative.",
      });
    }

    // Lookup linked wedding if present
    const wedding = await Wedding.findOne({ user: req.user._id });

    const expense = await Expense.create({
      title: title.trim(),
      category: category || "Other",
      estimatedAmount: Number(estimatedAmount),
      actualAmount: actualAmount !== undefined ? Number(actualAmount) : 0,
      paymentStatus: paymentStatus || "Unpaid",
      paymentDate: paymentDate ? new Date(paymentDate) : null,
      notes: notes ? notes.trim() : "",
      wedding: wedding ? wedding._id : null,
      user: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Expense added successfully!",
      expense,
    });
  } catch (error) {
    console.error("Create Expense Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to add expense.",
      error: error.message,
    });
  }
};

// @desc    Get all user expenses with budget calculations & summaries
// @route   GET /api/expenses
// @access  Private (JWT required)
export const getExpenses = async (req, res) => {
  try {
    const { category, paymentStatus, search } = req.query;

    const filter = { user: req.user._id };

    if (category && category !== "All") {
      filter.category = category;
    }

    if (paymentStatus && paymentStatus !== "All") {
      filter.paymentStatus = paymentStatus;
    }

    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { notes: { $regex: search.trim(), $options: "i" } },
      ];
    }

    // Filtered expenses for display
    const expenses = await Expense.find(filter).sort({ createdAt: -1 });

    // Fetch user's wedding to determine master wedding budget
    const wedding = await Wedding.findOne({ user: req.user._id });
    const weddingBudget = wedding ? Number(wedding.totalBudget) : 0;

    // Fetch ALL user expenses to calculate complete master budget metrics
    const allUserExpenses = await Expense.find({ user: req.user._id });

    const estimatedTotal = allUserExpenses.reduce(
      (sum, item) => sum + (Number(item.estimatedAmount) || 0),
      0
    );

    const actualTotal = allUserExpenses.reduce(
      (sum, item) => sum + (Number(item.actualAmount) || 0),
      0
    );

    const remainingBudget = weddingBudget - actualTotal;

    const budgetUsagePercentage =
      weddingBudget > 0 ? Math.round((actualTotal / weddingBudget) * 100) : 0;

    const isOverBudget = weddingBudget > 0 && actualTotal > weddingBudget;
    const overBudgetAmount = isOverBudget ? actualTotal - weddingBudget : 0;

    // Calculate vendor bookings metrics (excluding cancelled bookings)
    const activeBookings = await Booking.find({
      user: req.user._id,
      bookingStatus: { $ne: "Cancelled" },
    });

    const vendorCommittedTotal = activeBookings.reduce(
      (sum, b) => sum + (Number(b.totalAmount) || 0),
      0
    );
    const vendorPaidTotal = activeBookings.reduce(
      (sum, b) => sum + (Number(b.paidAmount) || 0),
      0
    );
    const vendorPendingTotal = activeBookings.reduce(
      (sum, b) => sum + (Number(b.remainingAmount) || 0),
      0
    );

    const combinedActualTotal = actualTotal + vendorPaidTotal;
    const combinedCommittedTotal = estimatedTotal + vendorCommittedTotal;
    const combinedRemainingBudget = weddingBudget - combinedActualTotal;
    const combinedBudgetUsagePercentage =
      weddingBudget > 0 ? Math.round((combinedActualTotal / weddingBudget) * 100) : 0;

    // Category breakdown
    const categoryMap = {};
    allUserExpenses.forEach((item) => {
      const cat = item.category || "Other";
      if (!categoryMap[cat]) {
        categoryMap[cat] = {
          category: cat,
          estimated: 0,
          actual: 0,
          count: 0,
        };
      }
      categoryMap[cat].estimated += Number(item.estimatedAmount) || 0;
      categoryMap[cat].actual += Number(item.actualAmount) || 0;
      categoryMap[cat].count += 1;
    });

    const categoryBreakdown = Object.values(categoryMap).sort(
      (a, b) => b.actual - a.actual
    );

    res.status(200).json({
      success: true,
      count: expenses.length,
      summary: {
        weddingBudget,
        estimatedTotal,
        actualTotal,
        remainingBudget,
        budgetUsagePercentage,
        isOverBudget,
        overBudgetAmount,
        categoryBreakdown,
        // Integrated Vendor Metrics
        vendorSummary: {
          totalCommitted: vendorCommittedTotal,
          totalPaid: vendorPaidTotal,
          totalPending: vendorPendingTotal,
          activeBookingsCount: activeBookings.length,
        },
        combinedActualTotal,
        combinedCommittedTotal,
        combinedRemainingBudget,
        combinedBudgetUsagePercentage,
      },
      expenses,
    });
  } catch (error) {
    console.error("Get Expenses Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve expenses.",
      error: error.message,
    });
  }
};

// @desc    Get a single expense by ID
// @route   GET /api/expenses/:id
// @access  Private (JWT required)
export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found or access denied.",
      });
    }

    res.status(200).json({
      success: true,
      expense,
    });
  } catch (error) {
    console.error("Get Expense Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve expense.",
      error: error.message,
    });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private (JWT required)
export const updateExpense = async (req, res) => {
  try {
    const {
      title,
      category,
      estimatedAmount,
      actualAmount,
      paymentStatus,
      paymentDate,
      notes,
    } = req.body;

    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found or access denied.",
      });
    }

    if (title !== undefined) expense.title = title.trim();
    if (category !== undefined) expense.category = category;
    if (estimatedAmount !== undefined) {
      if (isNaN(Number(estimatedAmount)) || Number(estimatedAmount) < 0) {
        return res.status(400).json({
          success: false,
          message: "Estimated amount must be a non-negative number.",
        });
      }
      expense.estimatedAmount = Number(estimatedAmount);
    }
    if (actualAmount !== undefined) {
      if (isNaN(Number(actualAmount)) || Number(actualAmount) < 0) {
        return res.status(400).json({
          success: false,
          message: "Actual amount cannot be negative.",
        });
      }
      expense.actualAmount = Number(actualAmount);
    }
    if (paymentStatus !== undefined) expense.paymentStatus = paymentStatus;
    if (paymentDate !== undefined) {
      expense.paymentDate = paymentDate ? new Date(paymentDate) : null;
    }
    if (notes !== undefined) expense.notes = notes.trim();

    await expense.save();

    res.status(200).json({
      success: true,
      message: "Expense updated successfully!",
      expense,
    });
  } catch (error) {
    console.error("Update Expense Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update expense.",
      error: error.message,
    });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private (JWT required)
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found or access denied.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully!",
    });
  } catch (error) {
    console.error("Delete Expense Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete expense.",
      error: error.message,
    });
  }
};
