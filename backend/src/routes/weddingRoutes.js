import express from "express";
import {
  createWedding,
  getMyWedding,
  updateMyWedding,
} from "../controllers/weddingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All wedding routes are protected by JWT authentication
router.post("/", protect, createWedding);
router.get("/my-wedding", protect, getMyWedding);
router.put("/my-wedding", protect, updateMyWedding);

export default router;

