import express from "express";
import { protect } from "../../../middlewares/authMiddleware.js";
import {
  getUserGroups,
  deleteGroup,
  createGroup,
  getGroupById,
  validateJoinCode,
  joinGroup,
  updateGroupInfo,
  createGroupMember
} from "../../../controllers/groupController.js";

const router = express.Router();

router.get("/", protect, getUserGroups);
router.delete("/:id", protect, deleteGroup);
router.get("/:id", protect, getGroupById);

router.post("/validate", protect, validateJoinCode );
router.post("/:id/join", protect, joinGroup);
router.post("/:id/members",protect, createGroupMember)

router.post("/", protect, createGroup);
router.patch("/:id/update", protect, updateGroupInfo);

export default router;
