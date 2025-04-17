import express from "express";
import { getUserGroups } from "../../../controllers/groupController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

// Create group
router.post("/", (req, res) => {
  res.send("Create group API");
});

// Get all groups
router.get("/", protect, getUserGroups); // ✅ GET /api/groups

// Get a specific group
router.get("/:groupId", (req, res) => {
  res.send("Get specific group API");
});

export default router;
