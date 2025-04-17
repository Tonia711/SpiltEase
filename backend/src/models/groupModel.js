import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  _id: Number,
  groupName: String,
  note: String,
  iconId: Number,
  budget: Number,
  totalExpenses: Number,
  totalRefunds: Number,
  startDate: Date,
  endDate: Date,
  joinCode: String,
  members: [
    {
      memberId: {
        type: String,
      },
      userName: String,
    },
  ],
});

const Group = mongoose.model("Group", groupSchema);

export default Group;
