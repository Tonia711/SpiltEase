import { Balance } from "../db/schema.js";
import mongoose from "mongoose";

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
      { groupId: new mongoose.Types.ObjectId(groupId), 
        "groupBalances.fromMemberId": new mongoose.Types.ObjectId(fromMemberId), 
        "groupBalances.toMemberId": new mongoose.Types.ObjectId(toMemberId) },
      {
        $set: {
          "groupBalances.$.isFinished": true,
        },
        $push: {
          "groupBalances.$.finishHistory": {
          },
        },
      },
      { new: true }
    );

    console.log("✅ 更新结果：", result);

    if (!result) {
      return res.status(404).json({ message: "Balance item not found" });
    }

    res.status(200).json({ message: "Marked as paid" });
  } catch (err) {
    console.error("Failed to update balance:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

