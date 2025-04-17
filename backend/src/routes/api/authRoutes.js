// File: backend/src/routes/api/authRoutes.js

import express from "express";
import { registerUser, loginUser } from "../../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser); // POST /api/auth/register
router.post("/login", loginUser); // POST /api/auth/login

export default router;
