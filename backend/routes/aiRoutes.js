import express from "express";
import { replySuggestions } from "../controllers/aiController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.post("/reply-suggestions", protect, replySuggestions);

export default router;
