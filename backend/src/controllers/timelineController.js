import Timeline from "../models/Timeline.js";
import Wedding from "../models/Wedding.js";

// Helper to convert time string (e.g. "09:30", "14:15", "9:30 AM", "2:15 PM") to minutes from midnight
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return null;
  const clean = timeStr.trim();

  // Match 12-hour format e.g. "09:30 AM" or "2:15 PM"
  const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const modifier = match12[3] ? match12[3].toUpperCase() : null;

    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Fallback match standard "HH:mm"
  const parts = clean.split(":");
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
  }
  return null;
};

// Validate that endTime is not earlier than startTime
const validateStartAndEndTime = (startTime, endTime) => {
  if (!startTime || !endTime) return true;
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);
  if (startMin !== null && endMin !== null) {
    return endMin >= startMin;
  }
  return true;
};

// Helper to compute statistics and determine the next upcoming event
const computeTimelineStats = async (userId) => {
  const allEvents = await Timeline.find({ user: userId }).sort({ eventDate: 1, startTime: 1 });
  const wedding = await Wedding.findOne({ user: userId });

  const totalEvents = allEvents.length;
  const upcomingEvents = allEvents.filter((e) => e.status === "Upcoming").length;
  const inProgressEvents = allEvents.filter((e) => e.status === "In Progress").length;
  const completedEvents = allEvents.filter((e) => e.status === "Completed").length;
  const cancelledEvents = allEvents.filter((e) => e.status === "Cancelled").length;

  // Find next upcoming event (earliest Upcoming or In Progress event)
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // First look for active/upcoming events today or in the future
  const activeEvents = allEvents.filter(
    (e) => e.status === "Upcoming" || e.status === "In Progress"
  );

  let nextUpcomingEvent = null;
  if (activeEvents.length > 0) {
    // Prefer upcoming event from today onwards
    const futureUpcoming = activeEvents.find((e) => new Date(e.eventDate) >= now);
    nextUpcomingEvent = futureUpcoming || activeEvents[0];
  }

  return {
    totalEvents,
    upcomingEvents,
    inProgressEvents,
    completedEvents,
    cancelledEvents,
    nextUpcomingEvent,
    weddingDate: wedding ? wedding.weddingDate : null,
  };
};

// @desc    Create a new timeline event
// @route   POST /api/timelines
// @access  Private (JWT required)
export const createTimelineEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      eventDate,
      startTime,
      endTime,
      location,
      category,
      responsiblePerson,
      priority,
      status,
      notes,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Event title is required.",
      });
    }

    if (!startTime || !startTime.trim()) {
      return res.status(400).json({
        success: false,
        message: "Start time is required.",
      });
    }

    // Validate that end time is not earlier than start time
    if (endTime && !validateStartAndEndTime(startTime, endTime)) {
      return res.status(400).json({
        success: false,
        message: "End time cannot be earlier than start time.",
      });
    }

    // Lookup linked wedding if present
    const wedding = await Wedding.findOne({ user: req.user._id });

    // Determine event date (fallback to weddingDate if omitted)
    let parsedDate = eventDate ? new Date(eventDate) : null;
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      parsedDate = wedding?.weddingDate ? new Date(wedding.weddingDate) : new Date();
    }

    const event = await Timeline.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      eventDate: parsedDate,
      startTime: startTime.trim(),
      endTime: endTime ? endTime.trim() : "",
      location: location ? location.trim() : "",
      category: category || "Ceremony",
      responsiblePerson: responsiblePerson ? responsiblePerson.trim() : "",
      priority: priority || "Medium",
      status: status || "Upcoming",
      notes: notes ? notes.trim() : "",
      wedding: wedding ? wedding._id : null,
      user: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Timeline event created successfully!",
      event,
    });
  } catch (error) {
    console.error("Create Timeline Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create timeline event.",
      error: error.message,
    });
  }
};

// @desc    Get all timeline events for user with filters & stats
// @route   GET /api/timelines
// @access  Private (JWT required)
export const getTimelineEvents = async (req, res) => {
  try {
    const { category, status, eventDate, search } = req.query;

    const filter = { user: req.user._id };

    if (category && category !== "All") {
      filter.category = category;
    }

    if (status && status !== "All") {
      filter.status = status;
    }

    if (eventDate) {
      const startOfDay = new Date(eventDate);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(eventDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      filter.eventDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
        { location: { $regex: search.trim(), $options: "i" } },
        { responsiblePerson: { $regex: search.trim(), $options: "i" } },
        { notes: { $regex: search.trim(), $options: "i" } },
      ];
    }

    // Chronological sort: date ascending, then startTime ascending
    const events = await Timeline.find(filter).sort({ eventDate: 1, startTime: 1, createdAt: 1 });
    const stats = await computeTimelineStats(req.user._id);

    res.status(200).json({
      success: true,
      count: events.length,
      stats,
      events,
    });
  } catch (error) {
    console.error("Get Timeline Events Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve timeline events.",
      error: error.message,
    });
  }
};

// @desc    Get a single timeline event by ID
// @route   GET /api/timelines/:id
// @access  Private (JWT required)
export const getTimelineEventById = async (req, res) => {
  try {
    const event = await Timeline.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Timeline event not found or access denied.",
      });
    }

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("Get Timeline Event By ID Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve timeline event.",
      error: error.message,
    });
  }
};

// @desc    Update a timeline event
// @route   PUT /api/timelines/:id
// @access  Private (JWT required)
export const updateTimelineEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      eventDate,
      startTime,
      endTime,
      location,
      category,
      responsiblePerson,
      priority,
      status,
      notes,
    } = req.body;

    const event = await Timeline.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Timeline event not found or access denied.",
      });
    }

    const effectiveStart = startTime !== undefined ? startTime : event.startTime;
    const effectiveEnd = endTime !== undefined ? endTime : event.endTime;

    if (effectiveEnd && !validateStartAndEndTime(effectiveStart, effectiveEnd)) {
      return res.status(400).json({
        success: false,
        message: "End time cannot be earlier than start time.",
      });
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Event title cannot be empty.",
        });
      }
      event.title = title.trim();
    }

    if (description !== undefined) event.description = description.trim();
    if (eventDate !== undefined && eventDate) event.eventDate = new Date(eventDate);
    if (startTime !== undefined) event.startTime = startTime.trim();
    if (endTime !== undefined) event.endTime = endTime.trim();
    if (location !== undefined) event.location = location.trim();
    if (category !== undefined) event.category = category;
    if (responsiblePerson !== undefined) event.responsiblePerson = responsiblePerson.trim();
    if (priority !== undefined) event.priority = priority;
    if (status !== undefined) event.status = status;
    if (notes !== undefined) event.notes = notes.trim();

    await event.save();

    res.status(200).json({
      success: true,
      message: "Timeline event updated successfully!",
      event,
    });
  } catch (error) {
    console.error("Update Timeline Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update timeline event.",
      error: error.message,
    });
  }
};

// @desc    Delete a timeline event
// @route   DELETE /api/timelines/:id
// @access  Private (JWT required)
export const deleteTimelineEvent = async (req, res) => {
  try {
    const event = await Timeline.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Timeline event not found or access denied.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Timeline event deleted successfully!",
    });
  } catch (error) {
    console.error("Delete Timeline Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete timeline event.",
      error: error.message,
    });
  }
};
