import express from "express";
import {
  getMe,
  updateMe,
  deleteMe,
  searchUsers,
  checkFieldExists,
} from "../../controllers/userController.js";
import { protect } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMe); // /api/users/me
router.put("/me", protect, updateMe);
router.delete("/me", protect, deleteMe);
router.get("/search", searchUsers);
router.get("/check", checkFieldExists);

export default router;
