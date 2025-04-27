import express from "express";
import { getAllLabels, createBill } from "../../../controllers/billController.js";
import { getBillsByGroupId } from "../../../controllers/billController.js"; 
import { getBillByGroupIdBillId } from "../../../controllers/billController.js";
import {deleteBillByGroupIdBillId} from "../../../controllers/billController.js";

const router = express.Router();

// Create bill
router.post("/", createBill);

// // Get all bills
// router.get("/", (req, res) => {
//   res.send("Get all bills API11");
// });

// Get all labels 这个在新建账单的时候用
router.get("/allLabels", getAllLabels);

// 根据 groupId 获取账单
router.get("/group/:groupId", getBillsByGroupId);

// 根据 groupId和billId 获取某一条账单
router.get("/:groupId/bill/:billId", getBillByGroupIdBillId);

//根据 groupId和billId 删除某一条账单
router.delete("/:groupId/bill/:billId", deleteBillByGroupIdBillId);


export default router;