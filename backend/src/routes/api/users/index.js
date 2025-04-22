import { Router } from "express";
import {
  getMe,
  updateMe,
  deleteMe,
  getUserAnnualSummary
} from "../../../controllers/userController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = Router();

router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.delete("/me", protect, deleteMe);
router.get("/me/annual-summary", protect, getUserAnnualSummary);

export default router;