import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
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
        type: Number,
      },
      userId: mongoose.Schema.Types.ObjectId,
      userName: String,
    },
  ],
});

const Group = mongoose.model("Group", groupSchema);

export default Group;
