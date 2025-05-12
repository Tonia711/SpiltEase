import express from "express";
import multer from "multer";
import path from "path";
import {
  getAllAvatars,
  uploadCustomAvatar,
} from "../../controllers/avatarController.js";

const router = express.Router();
const storage = multer.diskStorage({
  destination: "public/uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

router.get("/", getAllAvatars); // GET /api/avatars
router.post("/upload", upload.single("avatar"), uploadCustomAvatar); // 👈 POST /api/avatars/upload

export default router;
