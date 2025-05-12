import { Label } from "../db/schema.js";
import { Bill } from "../db/schema.js";
import  { Group } from "../db/schema.js";
import mongoose from "mongoose";

// get all labels
export const getAllLabels = async (req, res) => {
  try {
    const labels = await Label.find();
    res.json(labels);
  } catch (err) {
    console.error("Failed to fetch labels:", err);
    res.status(500).json({ error: "Failed to get labels" });
  }
};

// get all labels except transfer
export const getLabelsExceptTransfer = async (req, res) => {
  try {
    const labels = await Label.find({ type: { $ne: "transfer" } }); 
    res.json(labels);
  } catch (err) {
    console.error("Failed to fetch labels:", err);
    res.status(500).json({ error: "Failed to get labels" });
  }
};


// get all bills by groupId
export const getBillsByGroupId = async (req, res) => {
  try {
    const { groupId } = req.params;

    const bills = await Bill.aggregate([
        { $match: { groupId: new mongoose.Types.ObjectId(groupId) } },
        { $unwind: "$groupBills" }, 
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
              _id: "$groupBills._id",
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


// get a specific bill by groupId and billId
export const getBillByGroupIdBillId = async (req, res) => {
  const { groupId, billId } = req.params;

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

    bill.members.splice(0, bill.members.length);
    bill.members.push(...enrichedMembers);

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



// create a new bill
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

    const existing = await Bill.findOne({ groupId });
    let currentId = 0;
    if (existing?.groupBills?.length > 0) {
      currentId = existing.groupBills.reduce(
        (maxId, bill) => Math.max(maxId, bill.id ?? 0),
        0
      );
    }

    const newGroupBill = {
      id: currentId + 1, 
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
    console.error("Failed to create bill:", err);
    res.status(500).json({ error: "Failed to create bill" });
  }
};


// delete a specific bill by groupId and billId
export const deleteBillByGroupIdBillId = async (req, res) => {
  const { groupId, billId } = req.params;

  try {
    const billDoc = await Bill.findOne({ groupId: new mongoose.Types.ObjectId(groupId) });

    if (!billDoc) {
      return res.status(404).json({ message: "Group not found" });
    }

    const targetIndex = billDoc.groupBills.findIndex(b => b._id.toString() === billId);

    if (targetIndex === -1) {
      return res.status(404).json({ message: "Bill not found in group" });
    }

    billDoc.groupBills.splice(targetIndex, 1);
    await billDoc.save();
    return res.status(200).json({ message: "Bill deleted successfully" });

  } catch (err) {
    console.error("Failed to delete bill:", err);
    res.status(500).json({ message: "Failed to delete bill" });
  }
};


// update a specific bill by groupId and billId
export const updateBillByGroupIdBillId = async (req, res) => {
  const { groupId, billId } = req.params;
  const {
    labelId,
    date,
    note,
    paidBy,
    expenses,
    refunds,
    splitWay,
    members
  } = req.body;

  try {
    const billDoc = await Bill.findOne({ groupId: new mongoose.Types.ObjectId(groupId) });

    if (!billDoc) {
      return res.status(404).json({ message: "Group not found" });
    }

    const targetBill = billDoc.groupBills.find(b => b._id.toString() === billId);

    if (!targetBill) {
      return res.status(404).json({ message: "Bill not found in group" });
    }

    targetBill.labelId = labelId || targetBill.labelId;
    targetBill.date = date ? new Date(date) : targetBill.date;
    targetBill.note = note ?? targetBill.note; 
    targetBill.paidBy = paidBy || targetBill.paidBy;
    targetBill.expenses = expenses ?? targetBill.expenses;
    targetBill.refunds = refunds ?? targetBill.refunds;
    targetBill.splitWay = splitWay || targetBill.splitWay;
    targetBill.members = members || targetBill.members;

    await billDoc.save();

    return res.status(200).json({ message: "Bill updated successfully" });
  } catch (err) {
    console.error("Failed to update bill:", err);
    res.status(500).json({ message: "Failed to update bill" });
  }
};
