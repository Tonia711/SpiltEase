import express from "express";
import { getBalanceByGroupId, markBalanceAsFinished, recalculateGroupBalance } from "../../../controllers/balanceController.js";

const router = express.Router();

// GET /api/balances/group/:groupId
router.get("/group/:groupId", getBalanceByGroupId);

router.put("/group/:groupId/markPaid", markBalanceAsFinished);

router.post("/group/:groupId/recalculate", recalculateGroupBalance);

export default router;
