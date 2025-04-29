import express from "express";
import { getBalanceByGroupId } from "../../../controllers/balanceController.js";

const router = express.Router();

// GET /api/balances/group/:groupId
router.get("/group/:groupId", getBalanceByGroupId);

export default router;
