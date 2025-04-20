import express from "express";
import { protect } from "../../../middlewares/authMiddleware.js";
import {
  getUserGroups,
  deleteGroup,
  createGroup,
  getGroupById,
  validateJoinCode,
  joinGroup,
  updateGroupInfo
} from "../../../controllers/groupController.js";

const router = express.Router();

router.get("/", protect, getUserGroups);
router.delete("/:id", protect, deleteGroup);
router.post("/", protect, createGroup);
router.get("/:id", protect, getGroupById);

router.post("/validate-code", protect, validateJoinCode );
router.post("/:id/join", protect, joinGroup);
router.patch("/:id/update", protect, updateGroupInfo);

export default router;
