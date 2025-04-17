import dotenv from 'dotenv';
import mongoose from 'mongoose';
import {
  Avatar,
  Balance,
  Bill,
  Group,
  Icon,
  Label,
  User
} from './schema.js';

// 引入数据
import avatars from '../data/avatars.js';
import balances from '../data/balances.js';
import bills from '../data/bills.js';
import groups from '../data/groups.js';
import icons from '../data/icons.js';
import labels from '../data/labels.js';
import users from '../data/users.js';

// 导入 getMinimalTransfers 函数
import getMinimalTransfers from '../data/balancesCalculate.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// 计算最简转账
const calculatedBalances = getMinimalTransfers(bills); // 这里调用并传入 bills 数据

async function importData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Atlas connected!');

    // 清空旧数据
    await Promise.all([
      Avatar.deleteMany(),
      Balance.deleteMany(),
      Bill.deleteMany(),
      Group.deleteMany(),
      Icon.deleteMany(),
      Label.deleteMany(),
      User.deleteMany()
    ]);
    console.log('✅ Old data cleared');

    // 处理 avatars 数据，确保使用 _id 而不是 id
    const avatarData = avatars.map(avatar => ({
      _id: avatar.id,  // 使用 _id 代替 id，确保插入时不会发生冲突
      avatarUrl: avatar.avatarUrl
    }));

    // 插入新数据
    await Promise.all([
      Avatar.insertMany(avatarData),  // 插入修改后的 avatars 数据
      Balance.insertMany(calculatedBalances),  // 合并计算后的数据
      Bill.insertMany(bills),
      Group.insertMany(groups),
      Icon.insertMany(icons),
      Label.insertMany(labels),
      User.insertMany(users)
    ]);
    console.log('✅ All data inserted successfully!');
  } catch (error) {
    console.error('❌ Failed to import data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

importData();
