import express from "express";
const router = express.Router();

import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import avatarRoutes from "./avatarRoutes.js";
import groupRoutes from "./groups/index.js";
import billRoutes from "./bills/index.js";
import ocrRoutes from "./ocr/index.js";
import expenseRoutes from "./expenseRoutes.js";

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/avatars", avatarRoutes);
router.use("/groups", groupRoutes);
router.use("/bills", billRoutes);
router.use("/ocr", ocrRoutes);
router.use("/groups", expenseRoutes);

export default router;
