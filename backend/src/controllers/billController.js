import { Label } from "../db/schema.js";
import { Bill } from "../db/schema.js";
import mongoose from "mongoose";

// ✅ 获取所有标签
export const getAllLabels = async (req, res) => {
  try {
    const labels = await Label.find();
    res.json(labels);
  } catch (err) {
    console.error("Failed to fetch labels:", err);
    res.status(500).json({ error: "Failed to get labels" });
  }
};

// ✅ 根据 groupId 获取账单列表
export const getBillsByGroupId = async (req, res) => {
  try {
    const { groupId } = req.params;

    const bills = await Bill.aggregate([
        { $match: { groupId: new mongoose.Types.ObjectId(groupId) } },
        { $unwind: "$groupBills" },  // 拆开 groupBills
        {
          $lookup: {
            from: "labels",
            localField: "groupBills.labelId",
            foreignField: "_id",
            as: "groupBills.label"
          }
        },
        { $unwind: "$groupBills.label" }, // 把 label 也展开
        {
          $replaceRoot: { newRoot: "$groupBills" }
        }
    ]);

    res.status(200).json(bills);
  } catch (err) {
    console.error("Failed to fetch bills by group:", err);
    res.status(500).json({ message: "Failed to fetch bills." });
  }
};
