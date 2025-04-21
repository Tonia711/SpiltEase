import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User, Avatar, Balance, Bill, Group, Icon, Label } from "./schema.js";
const { Types } = mongoose;

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
    const avatarDocs = avatars.map((a, index) => {
      const doc = {
        avatarUrl: a.avatarUrl,
        isSystem: a.isSystem,
      };

      // ✅ 为前 10 个系统头像写死稳定 ObjectId
      if (a.isSystem && a.id && a.id <= 10) {
        const hexId = a.id.toString(16).padStart(24, "0");
        doc._id = new mongoose.Types.ObjectId(hexId);
        a._id = doc._id; // 👈 存回原始数组中供后续 avatarMap 使用
      }

      return doc;
    });

    const insertedAvatars = await Avatar.insertMany(avatarDocs);
    console.log("✅ Avatars inserted");

    // ✅ Step 2: 构建 avatarMap（使用写死 _id 或查找回来的 ObjectId）
    const avatarMap = {};
    avatars.forEach((a) => {
      avatarMap[a.id] =
        insertedAvatars.find((doc) => doc.avatarUrl === a.avatarUrl)._id
        || a._id;
    });

    const userDocs = [];
    const userIdMap = {};

    for (const u of users) { // 使用你引入的原始 users 数据
      const hashedPassword = await bcrypt.hash(u.password, 10);
      const userObjectId = new Types.ObjectId(); // 为每个用户生成一个 ObjectId
      userDocs.push({
          _id: userObjectId,
          userName: u.userName,
          email: u.email,
          password: hashedPassword,
          avatarId: avatarMap[u.avatarId], // 使用 avatarMap
          // groupId 稍后更新，因为它依赖于 groupMap
      });
      userIdMap[u.id] = userObjectId; // 存储原始ID到新ObjectId的映射
  }

  await User.insertMany(userDocs);
    console.log("✅ Users inserted and userIdMap created");

    // ✅ Step 2: 插入 Group 并使用 userIdMap
    const groupMap = {}; // 映射原始群组ID (数字) 到新的 Mongoose ObjectId
    const groupDocs = groups.map((g) => { // 使用你引入的原始 groups 数据
        const groupObjectId = new Types.ObjectId(); // 为每个群组生成一个 ObjectId
        groupMap[g.id] = groupObjectId; // 存储原始ID到新ObjectId的映射

        return {
            _id: groupObjectId,
            groupName: g.groupName,
            note: g.note || "",
            iconId: g.iconId || 0,
            budget: g.budget || 0,
            totalExpenses: g.totalExpenses || 0,
            totalRefunds: g.totalRefunds || 0,
            startDate: g.startDate ? new Date(g.startDate) : null,
            endDate: g.endDate ? new Date(g.endDate) : null,
            joinCode: g.joinCode || "",
            members: (g.members || []).map((m, i) => {
                const memberDoc = {
                    memberId: m.memberId || i,
                    userName: m.userName || `user${i}`,
                };
                // ✅ 关键修改: 处理 userId
                if (m.userId === "") {
                    // 如果原始 userId 是空字符串，设置为 null
                    memberDoc.userId = null;
                } else {
                    // 如果原始 userId 是数字 (对应真实用户)，查找 userIdMap 获取其 ObjectId
                    // 如果在 map 中找不到 (数据不一致)，也设为 null 或报错
                    memberDoc.userId = userIdMap[m.userId] || null;
                }
                return memberDoc;
            }),
        };
    });

    await Group.insertMany(groupDocs);
    console.log("✅ Groups inserted and groupMap created");

    // ✅ Step 3 (Optional but recommended): 更新 Users 的 groupId 字段
    // 现在 groupMap 已经可用，可以更新 Users 文档来引用它们所属的 Group
    // 这需要再次迭代原始 users 数据或查询刚刚插入的 Users
    // 假设原始 users 数据有 groupId 字段 (数字数组)
    const userUpdates = users.map(u => {
        const groupObjectIds = (u.groupId || []).map(groupId => groupMap[groupId]).filter(id => id); // 映射原始groupId到ObjectId，过滤掉null
        return {
            updateOne: {
                filter: { _id: userIdMap[u.id] }, // 找到对应的User文档
                update: { $set: { groupId: groupObjectIds } } // 设置 groupId 数组
            }
        };
    }).filter(update => update.updateOne.filter._id); // 确保有有效的 _id

    if (userUpdates.length > 0) {
       await User.bulkWrite(userUpdates);
       console.log("✅ Users updated with groupIds");
    }


  
// 1111
    // const groupMap = {};
    // const groupDocs = groups.map((g) => {
    //   const _id = new Types.ObjectId();
    //   groupMap[g.id] = _id;

    //   return {
    //     _id,
    //     groupName: g.groupName,
    //     note: g.note || "",
    //     iconId: g.iconId || 0,
    //     budget: g.budget || 0,
    //     totalExpenses: g.totalExpenses || 0,
    //     totalRefunds: g.totalRefunds || 0,
    //     startDate: g.startDate ? new Date(g.startDate) : null,
    //     endDate: g.endDate ? new Date(g.endDate) : null,
    //     joinCode: g.joinCode || "",
    //     members: (g.members || []).map((m, i) => ({
    //       memberId: m.memberId || i,
    //       userId: m.userId ? new mongoose.Types.ObjectId(m.userId) : new mongoose.Types.ObjectId(),
    //       userName: m.userName || `user${i}`,
    //     })),
    //   };
    // });

    // await Group.insertMany(groupDocs);
    // console.log("✅ Groups inserted");

    // // 处理并插入 User，使用映射后的 ObjectId
    // const userDocs = await Promise.all(
    //   users.map(async (u) => ({
    //     userName: u.userName,
    //     email: u.email,
    //     password: await bcrypt.hash(u.password, 10),
    //     avatarId: avatarMap[u.avatarId],
    //     groupId: u.groupId.map((id) => groupMap[id]),
    //   }))
    // );

    // await User.insertMany(userDocs);
    // console.log("✅ Users inserted");

    // 插入新数据
    await Promise.all([
      // Avatar.insertMany(avatarData),
      Balance.insertMany(calculatedBalances),
      Bill.insertMany(bills),
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
