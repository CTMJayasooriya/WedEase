import Task from "../models/Task.js";
import Wedding from "../models/Wedding.js";

// Default wedding checklist template
const DEFAULT_CHECKLIST_TEMPLATES = [
  {
    title: "Set wedding date and budget",
    description: "Decide on your target wedding season and allocate total financial budget across categories.",
    category: "General",
    priority: "High",
    status: "Completed", // Often completed in Phase 1
  },
  {
    title: "Select wedding venue",
    description: "Tour prospective ceremonial and reception venues, review availability and reserve your date.",
    category: "Venue",
    priority: "High",
    status: "Pending",
  },
  {
    title: "Prepare guest list",
    description: "Compile draft names and mailing addresses for primary and secondary invitations.",
    category: "General",
    priority: "High",
    status: "Pending",
  },
  {
    title: "Book photographer",
    description: "Interview wedding photographers and videographers to capture ceremony and reception memories.",
    category: "Photography",
    priority: "Medium",
    status: "Pending",
  },
  {
    title: "Book catering service",
    description: "Schedule menu tastings and finalize food, beverage, and dessert selections.",
    category: "Catering",
    priority: "Medium",
    status: "Pending",
  },
  {
    title: "Select wedding outfits",
    description: "Shop for bridal gown, veil, groom's suit, and wedding party attire with fitting timelines.",
    category: "Attire",
    priority: "Medium",
    status: "Pending",
  },
  {
    title: "Send invitations",
    description: "Design and mail formal invitations with RSVP response deadline instructions.",
    category: "Invitations",
    priority: "Medium",
    status: "Pending",
  },
  {
    title: "Arrange decorations",
    description: "Coordinate with florists and stylists for bridal bouquet, altar arrangements, and table centerpieces.",
    category: "Flowers & Decor",
    priority: "Medium",
    status: "Pending",
  },
  {
    title: "Confirm guest attendance",
    description: "Collect final RSVP headcounts and finalize dietary requests with the caterer.",
    category: "General",
    priority: "Medium",
    status: "Pending",
  },
  {
    title: "Finalize wedding-day schedule",
    description: "Draft minute-by-minute timeline for hair/makeup, photography, ceremony, speeches, and reception.",
    category: "Ceremony & Reception",
    priority: "High",
    status: "Pending",
  },
];

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (JWT required)
export const createTask = async (req, res) => {
  try {
    const { title, description, category, dueDate, priority, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required.",
      });
    }

    // Lookup user's wedding if linked
    const wedding = await Wedding.findOne({ user: req.user._id });

    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      category: category || "General",
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || "Medium",
      status: status || "Pending",
      wedding: wedding ? wedding._id : null,
      user: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully!",
      task,
    });
  } catch (error) {
    console.error("Create Task Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create task.",
      error: error.message,
    });
  }
};

// @desc    Get all tasks for the logged-in user with statistics
// @route   GET /api/tasks
// @access  Private (JWT required)
export const getTasks = async (req, res) => {
  try {
    const { status, priority, category } = req.query;

    const filter = { user: req.user._id };

    if (status && status !== "All") {
      filter.status = status;
    }

    if (priority && priority !== "All") {
      filter.priority = priority;
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    // Sort order: Pending & In Progress first, completed last; then by dueDate or createdAt
    const tasks = await Task.find(filter).sort({
      status: 1,
      dueDate: 1,
      createdAt: -1,
    });

    // Calculate overall statistics across ALL user tasks (unfiltered)
    const allUserTasks = await Task.find({ user: req.user._id });
    const totalTasks = allUserTasks.length;
    const completedTasks = allUserTasks.filter((t) => t.status === "Completed").length;
    const pendingTasks = allUserTasks.filter((t) => t.status === "Pending").length;
    const inProgressTasks = allUserTasks.filter((t) => t.status === "In Progress").length;
    const completionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.status(200).json({
      success: true,
      count: tasks.length,
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        completionPercentage,
      },
      tasks,
    });
  } catch (error) {
    console.error("Get Tasks Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve tasks.",
      error: error.message,
    });
  }
};

// @desc    Get a single task by ID
// @route   GET /api/tasks/:id
// @access  Private (JWT required)
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or access denied.",
      });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Get Task Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve task.",
      error: error.message,
    });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private (JWT required)
export const updateTask = async (req, res) => {
  try {
    const { title, description, category, dueDate, priority, status } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or access denied.",
      });
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (category !== undefined) task.category = category;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;

    await task.save();

    res.status(200).json({
      success: true,
      message: "Task updated successfully!",
      task,
    });
  } catch (error) {
    console.error("Update Task Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update task.",
      error: error.message,
    });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (JWT required)
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or access denied.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully!",
    });
  } catch (error) {
    console.error("Delete Task Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete task.",
      error: error.message,
    });
  }
};

// @desc    Generate default wedding checklist for user
// @route   POST /api/tasks/default-checklist
// @access  Private (JWT required)
export const generateDefaultChecklist = async (req, res) => {
  try {
    const wedding = await Wedding.findOne({ user: req.user._id });

    // Fetch existing tasks for this user to avoid duplicates
    const existingTasks = await Task.find({ user: req.user._id }).select("title");
    const existingTitles = new Set(existingTasks.map((t) => t.title.toLowerCase().trim()));

    // Filter templates to only include ones not yet added
    const tasksToInsert = DEFAULT_CHECKLIST_TEMPLATES.filter(
      (tmpl) => !existingTitles.has(tmpl.title.toLowerCase().trim())
    ).map((tmpl) => ({
      ...tmpl,
      user: req.user._id,
      wedding: wedding ? wedding._id : null,
    }));

    if (tasksToInsert.length === 0) {
      return res.status(200).json({
        success: true,
        message: "All default wedding tasks are already in your checklist.",
        createdCount: 0,
      });
    }

    const insertedTasks = await Task.insertMany(tasksToInsert);

    res.status(201).json({
      success: true,
      message: `Successfully generated ${insertedTasks.length} wedding checklist tasks!`,
      createdCount: insertedTasks.length,
      tasks: insertedTasks,
    });
  } catch (error) {
    console.error("Default Checklist Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to generate default checklist.",
      error: error.message,
    });
  }
};

