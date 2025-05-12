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
        type: mongoose.Schema.Types.ObjectId,
        ref: "Label",
      },
      date: Date,
      note: String,
      paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      expenses: Number,
      refunds: Number,
      splitWay: String,
      members: [
        {
          memberId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
          },
          expense: Number,
          refund: Number,
        },
      ],
    },
  ],
});

const Bill = mongoose.model("Bill", billSchema);

export default Bill;
