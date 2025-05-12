import express from "express";
import multer from "multer";
import path from "path";
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
  checkMemberdeletable,
} from "../../../controllers/groupController.js";
import { getGroupSummary } from "../../../controllers/summaryController.js";

const router = express.Router();
const storage = multer.diskStorage({
  destination: "public/groups/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

router.get("/", protect, getUserGroups);
router.delete("/:id", protect, deleteGroup);
router.get("/:id", protect, getGroupById);
router.get("/:id/summary", protect, getGroupSummary);

router.post("/validate", protect, validateJoinCode);
router.post("/join", protect, joinGroupByCode);

router.post("/create", protect, createGroup);
router.post("/icon", upload.single("icon"), updateGroupIcon);
router.get(
  "/:id/check-member-deletable/:memberId",
  protect,
  checkMemberdeletable
);
router.put("/:id/update", protect, updateGroupInfo);

export default router;
