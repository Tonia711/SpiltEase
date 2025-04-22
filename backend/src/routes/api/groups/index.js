import express from "express";
import { protect } from "../../../middlewares/authMiddleware.js";
import {
  getUserGroups,
  deleteGroup,
  createGroup,
  getGroupById,
  validateJoinCode,
  updateGroupInfo,
  joinGroupByCode,
  getGroupSummary
} from "../../../controllers/groupController.js";

const router = express.Router();

router.get("/", protect, getUserGroups);
router.delete("/:id", protect, deleteGroup);
router.get("/:id", protect, getGroupById);
router.get("/:id/summary", protect, getGroupSummary);

router.post("/validate", protect, validateJoinCode );
router.post("/join", protect, joinGroupByCode);

router.post("/", protect, createGroup);
router.patch("/:id/update", protect, updateGroupInfo);

export default router;
