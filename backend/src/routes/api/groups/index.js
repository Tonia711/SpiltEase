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
  updateGroupIcon,
  deleteGroupMember,
  checkMemberdeletable
} from "../../../controllers/groupController.js";

const router = express.Router();

router.get("/", protect, getUserGroups);
router.delete("/:id", protect, deleteGroup);
router.get("/:id", protect, getGroupById);

router.post("/validate", protect, validateJoinCode );
router.post("/join", protect, joinGroupByCode);

router.post("/", protect, createGroup);
router.patch("/:id/update", protect, updateGroupInfo);
router.post("/:id/icon", protect, updateGroupIcon);
router.delete("/:id/members/:memberId/check-deletable", protect, checkMemberdeletable);
router.delete("/:id/members/:memberId", protect, deleteGroupMember);

export default router;
