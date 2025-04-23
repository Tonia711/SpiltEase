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

    console.log("🔍 Matching groupId:", groupId, "→", new mongoose.Types.ObjectId(groupId));

    const bills = await Bill.aggregate([
        { $match: { groupId: new mongoose.Types.ObjectId(groupId) } },
        { $unwind: "$groupBills" },  // 拆开 groupBills
        {
          $lookup: {
            from: "labels",
            localField: "groupBills.labelId",
            foreignField: "_id",
            as: "label"
          }
        },
        { $unwind: { path: "$label", preserveNullAndEmptyArrays: true } },
        {
            $project: {
              _id: "$groupBills._id", // 可以换成 "$_id" 保留原 Bill 文档的 id
              label: "$label",
              date: "$groupBills.date",
              note: "$groupBills.note",
              paidBy: "$groupBills.paidBy",
              expenses: "$groupBills.expenses",
              refunds: "$groupBills.refunds",
              splitWay: "$groupBills.splitWay",
              members: "$groupBills.members",
            }
        }          
    ]);

    res.status(200).json(bills);
  } catch (err) {
    console.error("Failed to fetch bills by group:", err);
    res.status(500).json({ message: "Failed to fetch bills." });
  }
};
