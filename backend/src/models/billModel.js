import mongoose from "mongoose";

const billSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },

  groupBills: [
    {
      labelId: { type: mongoose.Schema.Types.ObjectId, ref: "Label" },
      date: Date,
      note: String,

      paidBy: { type: mongoose.Schema.Types.ObjectId, required: true }, // ← 成员 _id
      expenses: Number,
      refunds: Number,
      splitWay: String,

      members: [
        {
          memberId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ← 成员 _id
          expense: Number,
          refund: Number,
        },
      ],
    },
  ],
});

export default mongoose.models.Bill || mongoose.model("Bill", billSchema);
