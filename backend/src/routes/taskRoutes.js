import express from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  generateDefaultChecklist,
} from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All task routes require JWT authentication
router.post("/", protect, createTask);
router.get("/", protect, getTasks);
router.post("/default-checklist", protect, generateDefaultChecklist);
router.get("/:id", protect, getTaskById);
router.put("/:id", protect, updateTask);
router.delete("/:id", protect, deleteTask);

export default router;

