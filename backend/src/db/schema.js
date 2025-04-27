import mongoose from "mongoose";
import User from "../models/userModel.js";
import Avatar from "../models/avatarModel.js";
import Group from "../models/groupModel.js";
import Bill from "../models/billModel.js";
import Label from "../models/labelModel.js";

// 图标
const iconSchema = new mongoose.Schema({
  iconUrl: String,
});
const Icon = mongoose.models.Icon || mongoose.model("Icon", iconSchema);

// 余额
const balanceSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
  groupBalances: [
    {
      fromMemberId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      toMemberId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      balance: Number,
      isFinished: { type: Boolean, default: false },
      finishHistory: [{ date: Date, amount: Number }],
    },
  ],
});
const Balance =
  mongoose.models.Balance || mongoose.model("Balance", balanceSchema);

// 结算记录
const balancesCalculateSchema = new mongoose.Schema({
  groupId: { type: Number, required: true },
  calculatedAt: { type: Date, default: Date.now },
  groupBalances: [
    {
      fromMemberId: Number,
      toMemberId: Number,
      balance: Number,
    },
  ],
});
const BalancesCalculate =
  mongoose.models.BalancesCalculate ||
  mongoose.model("BalancesCalculate", balancesCalculateSchema);

// —— 最后统一导出 ——
// User 和 Avatar 直接复用各自的 model
export { User, Avatar, Label, Group, Icon, Bill, Balance, BalancesCalculate };
