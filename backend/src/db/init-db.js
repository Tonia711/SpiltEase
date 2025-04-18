import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { Avatar, Balance, Bill, Group, Icon, Label } from "./schema.js";
import User from "../models/userModel.js";

// 引入数据
import avatars from "../data/avatars.js";
import balances from "../data/balances.js";
import bills from "../data/bills.js";
import groups from "../data/groups.js";
import icons from "../data/icons.js";
import labels from "../data/labels.js";
import users from "../data/users.js";

// 导入 getMinimalTransfers 函数
import getMinimalTransfers from "../data/balancesCalculate.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

// 计算最简转账
const calculatedBalances = getMinimalTransfers(bills); // 这里调用并传入 bills 数据

async function importData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Atlas connected!");

    // 清空旧数据
    await Promise.all([
      Avatar.deleteMany(),
      Balance.deleteMany(),
      Bill.deleteMany(),
      Group.deleteMany(),
      Icon.deleteMany(),
      Label.deleteMany(),
      User.deleteMany(),
    ]);
    console.log("✅ Old data cleared");

    // 插入 Avatar，让 Mongo 自动生成 ObjectId
    const avatarDocs = avatars.map((a) => ({
      avatarUrl: a.avatarUrl,
      isSystem: a.isSystem,
    }));
    const insertedAvatars = await Avatar.insertMany(avatarDocs);
    console.log("✅ Avatars inserted");

    // 建立数字 ID → ObjectId 映射
    const avatarMap = {};
    // 假设 data/avatars.js 的顺序和 insertedAvatars 一一对应
    avatars.forEach((a, idx) => {
      avatarMap[a.id] = insertedAvatars[idx]._id;
    });

    // 处理并插入 User，使用映射后的 ObjectId
    const userDocs = await Promise.all(
      users.map(async (u) => ({
        userName: u.userName,
        email: u.email,
        password: await bcrypt.hash(u.password, 10),
        avatarId: avatarMap[u.avatarId], // ← ObjectId
        groupId: u.groupId,
      }))
    );
    await User.insertMany(userDocs);
    console.log("✅ Users inserted");

    // 插入新数据
    await Promise.all([
      // Avatar.insertMany(avatarData),
      Balance.insertMany(calculatedBalances),
      Bill.insertMany(bills),
      Group.insertMany(groups),
      Icon.insertMany(icons),
      Label.insertMany(labels),
      // User.insertMany(hashedUsers),
    ]);
    console.log("✅ All data inserted successfully!");
  } catch (error) {
    console.error("❌ Failed to import data:", error);
  } finally {
    await mongoose.disconnect();
  }
}

importData();
