import mongoose from "mongoose";
import User from "../models/userModel.js";
import Avatar from "../models/avatarModel.js";
import Group from "../models/groupModel.js";
import Bill from "../models/billModel.js";
import Label from "../models/labelModel.js";

// 标签
// const labelSchema = new mongoose.Schema({
//   _id: Number,
//   type: String,
//   iconUrl: String,
// });
// const Label = mongoose.models.Label || mongoose.model("Label", labelSchema);

// 图标
const iconSchema = new mongoose.Schema({
  _id: Number,
  iconUrl: String,
});
const Icon = mongoose.models.Icon || mongoose.model("Icon", iconSchema);

// 账单
// const billSchema = new mongoose.Schema({
//   groupId: Number,
//   groupBills: [
//     {
//       id: Number,
//       labelId: Number,
//       date: Date,
//       note: String,
//       paidBy: Number,
//       expenses: Number,
//       refunds: Number,
//       splitWay: String,
//       members: [{ memberId: Number, expense: Number, refund: Number }],
//     },
//   ],
// });
// const Bill = mongoose.models.Bill || mongoose.model("Bill", billSchema);

// 余额
const balanceSchema = new mongoose.Schema({
  groupId: Number,
  groupBalances: [
    {
      fromMemberId: Number,
      toMemberId: Number,
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
