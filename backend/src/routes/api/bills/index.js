import express from "express";
import { getAllLabels, createBill } from "../../../controllers/billController.js";
import { getBillsByGroupId } from "../../../controllers/billController.js"; 
import {getBillByGroupIdBillId, deleteBillByGroupIdBillId, updateBillByGroupIdBillId, getLabelsExceptTransfer} from "../../../controllers/billController.js";

const router = express.Router();

// Create bill
router.post("/", createBill);

// Get all labels 
router.get("/allLabels", getAllLabels);

// get all labels except transfer
router.get("/labelsExcTrans", getLabelsExceptTransfer);

// get all bills by groupId
router.get("/group/:groupId", getBillsByGroupId);

// get a specific bill by groupId and billId
router.get("/:groupId/bill/:billId", getBillByGroupIdBillId);

// delete a specific bill by groupId and billId
router.delete("/:groupId/bill/:billId", deleteBillByGroupIdBillId);

// update a specific bill by groupId and billId
router.put("/:groupId/bill/:billId", updateBillByGroupIdBillId);

export default router;