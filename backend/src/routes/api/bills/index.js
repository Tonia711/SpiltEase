import express from "express";
import { getAllLabels } from "../../../controllers/billController.js";
import { getBillsByGroupId } from "../../../controllers/billController.js"; 
import { getBillByGroupIdBillId } from "../../../controllers/billController.js";

const router = express.Router();

// Create bill
router.post("/", (req, res) => {
  res.send("Create bill API");
});

// Get all bills
router.get("/", (req, res) => {
  res.send("Get all bills API11");
});

// Get all labels 这个在新建账单的时候用
router.get("/allLabels", getAllLabels);

// 根据 groupId 获取账单
router.get("/group/:groupId", getBillsByGroupId);

// 根据 groupId和billId 获取某一条账单
router.get("/:groupId/bill/:billId", getBillByGroupIdBillId);


export default router;