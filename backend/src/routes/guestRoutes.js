import express from "express";
import {
  createGuest,
  getGuests,
  getGuestStatistics,
  getGuestById,
  updateGuest,
  deleteGuest,
} from "../controllers/guestController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All guest routes require JWT authentication
router.post("/", protect, createGuest);
router.get("/", protect, getGuests);
router.get("/statistics", protect, getGuestStatistics);
router.get("/:id", protect, getGuestById);
router.put("/:id", protect, updateGuest);
router.delete("/:id", protect, deleteGuest);

export default router;
