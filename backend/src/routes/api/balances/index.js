import express from "express";
import { getBalanceByGroupId, markBalanceAsFinished } from "../../../controllers/balanceController.js";

const router = express.Router();

// GET /api/balances/group/:groupId
router.get("/group/:groupId", getBalanceByGroupId);

router.put("/group/:groupId/markPaid", markBalanceAsFinished);

export default router;
