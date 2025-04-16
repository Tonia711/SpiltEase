import express from "express";

const router = express.Router();

import authRoutes from "./auth/index.js";
router.use("/auth", authRoutes);

import userRoutes from "./users/index.js";
router.use("/users", userRoutes);

import groupRoutes from "./groups/index.js";
router.use("/groups", groupRoutes);

import billRoutes from "./bills/index.js";
router.use("/bills", billRoutes);

import ocrRoutes from "./ocr/index.js";
router.use("/ocr", ocrRoutes);

export default router;