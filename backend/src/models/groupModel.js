import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  groupName: String,
  note: String,
  iconId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Icon",
  },
  budget: Number,
  totalExpenses: Number,
  totalRefunds: Number,
  startDate: Date,
  endDate: Date,
  joinCode: {
    type: String,
    unique: true,
  },
  members: [
    {
      memberId: {
        type: Number,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      userName: String,
    },
  ],
});

const Group = mongoose.model("Group", groupSchema);

export default Group;
