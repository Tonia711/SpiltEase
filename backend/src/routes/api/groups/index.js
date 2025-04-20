import express from "express";
import { protect } from "../../../middlewares/authMiddleware.js";
import {
  getUserGroups,
  deleteGroup,
  createGroup,
  getGroupById
} from "../../../controllers/groupController.js";

const router = express.Router();

router.get("/", protect, getUserGroups);
router.delete("/:id", protect, deleteGroup);
router.post("/", protect, createGroup);
router.get("/:id", protect, getGroupById);

export default router;
