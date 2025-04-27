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
    const balance = await Balance.findOne({ groupId: new mongoose.Types.ObjectId(groupId) })
      .populate("groupBalances.fromMemberId", "userName")  // 👈 填充 fromMemberId，只拿 userName
      .populate("groupBalances.toMemberId", "userName");    // 👈 填充 toMemberId，只拿 userName

    if (!balance) {
      return res.status(404).json({ error: "Balance not found for this group" });
    }

    res.json(balance);
  } catch (err) {
    console.error("Error fetching balance:", err);
    res.status(500).json({ error: "Server error" });
  }
};
