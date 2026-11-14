import express from "express";
import {
  askWeddingAssistant,
  getBudgetAdvisorReport,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All AI endpoints require JWT authentication
router.post("/wedding-assistant", protect, askWeddingAssistant);
router.post("/budget-advisor", protect, getBudgetAdvisorReport);
router.get("/budget-advisor", protect, getBudgetAdvisorReport);

export default router;
