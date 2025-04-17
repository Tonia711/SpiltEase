import mongoose from 'mongoose';

// 用户数据模型
const userSchema = new mongoose.Schema({
    _id: Number,         
    userName: String,   
    email: String,
    password: { 
      type: String, 
      required: true
    },
    avatarId: Number,        
    groupId: [Number]
});

// 标签数据模型
const labelSchema = new mongoose.Schema({
    _id: Number, 
    type: String,
    iconUrl: String
});

// 组数据模型
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
            type: Number,
        },
        userName: String
      }
    ]
});

// 图标数据模型
const iconSchema = new mongoose.Schema({
    _id: Number,
    iconUrl: String,
});

// 账单数据模型
const billSchema = new mongoose.Schema({
    groupId: Number,
    groupBills: [
      {
        id: Number,
        labelId: Number,
        date: Date,
        note: String,
        paidBy: Number,
        expenses: Number,
        refunds: Number,
        splitWay: String,
        members: [
          {
            memberId: {
                type: Number,
            },
            expense: Number,
            refund: Number
          }
        ]
      }
    ]
});

// 余额数据模型
const balanceSchema = new mongoose.Schema({
    groupId: Number,
    groupBalances: [
      {
        fromMemberId: {
          type: Number,
        },
        toMemberId: {
            type: Number,
        },
        balance: Number,
        isFinished: { 
          type: Boolean, 
          default: false 
        },
        finishHistory: [
          {
            date: Date,
            amount: Number
          }
        ]
      }
    ]
});

// 头像数据模型
const avatarSchema = new mongoose.Schema({
    _id: Number,
    avatarUrl: String
});

// 结算数据模型
const balancesCalculateSchema = new mongoose.Schema({
    groupId: {
      type: Number,
      required: true
    },
    calculatedAt: {
      type: Date,
      default: Date.now // 自动记录生成结算时的时间
    },
    groupBalances: [
      {
        fromMemberId: {
            type: Number,
        },
        toMemberId: {
            type: Number,
        },
        balance: {
            type: Number,
            required: true
        }
      }
    ]
});

// 创建模型
const User = mongoose.model('User', userSchema);
const Label = mongoose.model('Label', labelSchema);
const Group = mongoose.model('Group', groupSchema);
const Icon = mongoose.model('Icon', iconSchema);
const Bill = mongoose.model('Bill', billSchema);
const Balance = mongoose.model('Balance', balanceSchema);
const Avatar = mongoose.model('Avatar', avatarSchema);
const BalancesCalculate = mongoose.model('BalancesCalculate', balancesCalculateSchema);

// 导出模型
export {
  User,
  Label,
  Group,
  Icon,
  Bill,
  Balance,
  Avatar,
  BalancesCalculate
};
