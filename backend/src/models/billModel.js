import mongoose from "mongoose";

const billSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Group",
    required: true,
  },
  groupBills: [
    {
      id: Number,
      labelId: {
        type: mongoose.Schema.Types.ObjectId,  // Changed back to ObjectId to support future custom categories
        ref: "Label",
      },
      date: Date,
      note: String,
      paidBy: Number,
      expenses: Number,
      refunds: Number,
      splitWay: String,
      members: [{ memberId: Number, expense: Number, refund: Number }],
    },
  ],
});

const Bill = mongoose.model("Bill", billSchema);

export default Bill;
