import { Balance } from "../db/schema.js";
import mongoose from "mongoose";
import { Bill } from "../db/schema.js";
import getMinimalTransfers from "../data/balancesCalculate.js";

// GET /api/balances/group/:groupId
export const getBalanceByGroupId = async (req, res) => {
  try {
    const { groupId } = req.params;

    // 确保 groupId 是有效的 ObjectId
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ error: "Invalid groupId format" });
    }

    // 查询 balance，groupId要转成 ObjectId
    const balance = await Balance.findOne({ groupId: new mongoose.Types.ObjectId(groupId) }).lean();

    if (!balance) {
      return res.status(404).json({ error: "Balance not found for this group" });
    }

    res.json(balance);
  } catch (err) {
    console.error("Error fetching balance:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const markBalanceAsFinished = async (req, res) => {
  const { groupId } = req.params;
  const { fromMemberId, toMemberId } = req.body;

  try {
    const result = await Balance.findOneAndUpdate(
      { groupId: new mongoose.Types.ObjectId(groupId)}, 
      {
        $set: {
          "groupBalances.$[elem].isFinished": true,
        },
        $push: {
          "groupBalances.$[elem].finishHistory": {
            date: new Date(),
          },
        },
      },
      {
        arrayFilters: [
          {
            "elem.fromMemberId": new mongoose.Types.ObjectId(fromMemberId),
            "elem.toMemberId": new mongoose.Types.ObjectId(toMemberId)
          }
        ], 
        new: true 
      }
    );

    if (!result) {
      return res.status(404).json({ message: "Balance item not found" });
    }

    res.status(200).json({ message: "Marked as paid" });
  } catch (err) {
    console.error("Failed to update balance:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/balances/group/:groupId/recalculate
export const recalculateGroupBalance = async (req, res) => {
  const { groupId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ error: "Invalid groupId format" });
    }

    // 查询该 group 的所有账单
    const billDocs = await Bill.find({ 
      groupId: new mongoose.Types.ObjectId(groupId)
    }).lean(); 

    const allGroupBills = billDocs.flatMap(doc => doc.groupBills);
    const filteredBills = allGroupBills.filter(b => b.labelId?.toString() !== "000000000000000000000007");

    const inputData = [
      {
        groupId,
        groupBills: filteredBills.map(bill => ({
          ...bill,
          paidBy: bill.paidBy.toString(),
          members: (bill.members || []).map(m => ({
            ...m,
            memberId: m.memberId.toString(),
          }))
        })),
      }
    ];

    // 重新计算最简转账
    const result = getMinimalTransfers(inputData);
    const groupResult = result.find(g => g.groupId.toString() === groupId.toString());

    // 更新数据库中的 balance（覆盖）
    const updated = await Balance.findOneAndUpdate(
      { groupId: new mongoose.Types.ObjectId(groupId) },
      { groupBalances: groupResult.groupBalances },
      { upsert: true, new: true }
    );

    res.json({ message: "Balance recalculated", groupBalances: updated.groupBalances });
  } catch (err) {
    console.error("Error recalculating balance:", err);
    res.status(500).json({ error: "Server error during balance recalculation" });
  }
};