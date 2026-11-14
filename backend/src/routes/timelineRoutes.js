import express from "express";
import {
  createTimelineEvent,
  getTimelineEvents,
  getTimelineEventById,
  updateTimelineEvent,
  deleteTimelineEvent,
} from "../controllers/timelineController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All timeline routes require JWT authentication
router.post("/", protect, createTimelineEvent);
router.get("/", protect, getTimelineEvents);
router.get("/:id", protect, getTimelineEventById);
router.put("/:id", protect, updateTimelineEvent);
router.delete("/:id", protect, deleteTimelineEvent);

export default router;

