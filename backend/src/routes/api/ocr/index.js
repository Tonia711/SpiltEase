import express from "express";
import multer from "multer";
import path from "path";
import { processReceipt } from "../../../controllers/ocrController.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, "user-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// OCR receipt route - processes an image to extract the total amount
router.post("/receipt", upload.single("image"), processReceipt);

export default router;