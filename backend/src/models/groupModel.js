import mongoose from "mongoose";

const memberSubSchema = new mongoose.Schema(
  {
    _id: {
      // ← Mongo 会自动生成
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },
    userName: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isVirtual: { type: Boolean, default: true },
  },
  { _id: false }
); // 让上面的 _id 成为真正的 id

const groupSchema = new mongoose.Schema({
  groupName: String,
  note: String,
  iconId: { type: mongoose.Schema.Types.ObjectId, ref: "Icon" },
  budget: Number,
  totalExpenses: Number,
  totalRefunds: Number,
  startDate: Date,
  endDate: Date,
  joinCode: { type: String, unique: true },
  members: [memberSubSchema],
});

export default mongoose.models.Group || mongoose.model("Group", groupSchema);
