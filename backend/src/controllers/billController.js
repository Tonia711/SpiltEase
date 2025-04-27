import { Label } from "../db/schema.js";
import { Bill } from "../db/schema.js";
import  { Group } from "../db/schema.js";
import mongoose from "mongoose";

//获取所有标签
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


// 根据 groupId 和 billId 获取单个bill
export const getBillByGroupIdBillId = async (req, res) => {
  const { groupId, billId } = req.params;
  console.log("groupId", groupId);
  console.log("billId", billId);

  try {
    const bills = await Bill.findOne({ groupId: new mongoose.Types.ObjectId(groupId) });

    if (!bills) {
      return res.status(404).json({ message: "Group not found" });
    }

    const bill = bills.groupBills.find(b => b._id.toString() === billId);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found in group" });
    }

    const group = await Group.findById(groupId).lean();
    const paidByMember = group?.members.find(m => m._id.toString() === bill.paidBy.toString());

    const enrichedMembers = (bill.members || []).map(member => {
      const found = group?.members.find(m => m._id.toString() === member.memberId.toString());
      return {
        memberId: member.memberId,
        expense: member.expense,
        refund: member.refund,
        userName: found?.userName || "Unknown"
      };
    });

    // 🔥 正确更新 members：清空再 push
    bill.members.splice(0, bill.members.length);
    bill.members.push(...enrichedMembers);

    // 保存回数据库
    await bills.save();

    return res.status(200).json({
      ...bill.toObject(),
      paidBy: paidByMember?._id || "Unknown",
      paidByName: paidByMember?.userName || "Unknown",
      members: enrichedMembers
    });

  } catch (error) {
    console.error("Error fetching group bill:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// 创建新bill
export const createBill = async (req, res) => {
  try {
    const {
      groupId,
      labelId,
      date,
      note,
      paidBy,
      expenses,
      refunds,
      splitWay,
      members
    } = req.body;

    // 获取当前 group 下已有的账单数量用于 id 自增
    const existing = await Bill.findOne({ groupId });
    const currentId = existing?.groupBills?.length || 0;

    const newGroupBill = {
      id: currentId + 1, // 自增 id
      labelId,
      date: new Date(date),
      note,
      paidBy,
      expenses,
      refunds,
      splitWay,
      members
    };

    let billDoc = await Bill.findOne({ groupId });

    if (billDoc) {
      billDoc.groupBills.push(newGroupBill);
      await billDoc.save();
    } else {
      billDoc = await Bill.create({
        groupId,
        groupBills: [newGroupBill]
      });
    }

    res.status(201).json(billDoc);
  } catch (err) {
    console.error("❌ Failed to create bill:", err);
    res.status(500).json({ error: "Failed to create bill" });
  }
};


// 根据 groupId 和 billId 删除单个bill
export const deleteBillByGroupIdBillId = async (req, res) => {
  const { groupId, billId } = req.params;

  try {
    const billDoc = await Bill.findOne({ groupId: new mongoose.Types.ObjectId(groupId) });

    console.log("1");

    if (!billDoc) {
      return res.status(404).json({ message: "Group not found" });
    }

    // 找要删除的那一条 bill
    const targetIndex = billDoc.groupBills.findIndex(b => b._id.toString() === billId);

    if (targetIndex === -1) {
      return res.status(404).json({ message: "Bill not found in group" });
    }

    // 删除指定的 bill
    billDoc.groupBills.splice(targetIndex, 1);

    if (billDoc.groupBills.length === 0) {
      // 如果删完没有账单了，删除整个 Bill 文档
      await Bill.deleteOne({ _id: billDoc._id });
      return res.status(200).json({ message: "Bill and group deleted successfully" });
    } else {
      // 如果还有账单，保存剩下的
      await billDoc.save();
      return res.status(200).json({ message: "Bill deleted successfully" });
    }
  } catch (err) {
    console.error("❌ Failed to delete bill:", err);
    res.status(500).json({ message: "Failed to delete bill" });
  }
};
