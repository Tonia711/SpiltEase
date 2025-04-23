import express from "express";
import { getMe, updateMe, deleteMe } from "../../controllers/userController.js";
import { protect } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMe); // /api/users/me
router.put("/me", protect, updateMe);
router.delete("/me", protect, deleteMe);

export default router;
