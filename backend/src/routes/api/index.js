import express from "express";
const router = express.Router();

import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import avatarRoutes from "./avatarRoutes.js";
import groupRoutes from "./groups/index.js";
import billRoutes from "./bills/index.js";
import balancesRouter from "./balances/index.js";
import ocrRoutes from "./ocr/index.js";

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/avatars", avatarRoutes);
router.use("/groups", groupRoutes);
router.use("/bills", billRoutes);
router.use("/balances", balancesRouter);
router.use("/ocr", ocrRoutes);

export default router;
