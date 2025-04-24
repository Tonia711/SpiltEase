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
      userIdMap[u.id] = userObjectId;
  }

  await User.insertMany(userDocs);
    console.log("✅ Users inserted and userIdMap created");

    const groupMap = {}; 
    const groupDocs = groups.map((g) => { 
        const groupObjectId = new Types.ObjectId();
        groupMap[g.id] = groupObjectId; 

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
                if (m.userId === "") {
                    memberDoc.userId = null;
                } else {
                    memberDoc.userId = userIdMap[m.userId] || null;
                }
                return memberDoc;
            }),
        };
    });

    await Group.insertMany(groupDocs);
    console.log("✅ Groups inserted and groupMap created");

    const userUpdates = users.map(u => {
        const groupObjectIds = (u.groupId || []).map(groupId => groupMap[groupId]).filter(id => id); // 映射原始groupId到ObjectId，过滤掉null
        return {
            updateOne: {
                filter: { _id: userIdMap[u.id] }, 
                update: { $set: { groupId: groupObjectIds } }
            }
        };
    }).filter(update => update.updateOne.filter._id); 

    if (userUpdates.length > 0) {
       await User.bulkWrite(userUpdates);
       console.log("✅ Users updated with groupIds");
    }



// 将labelId转为object
const labelsDocs = labels.map((a, index) => {
  const doc = {
    type: a.type,
    iconUrl: a.iconUrl,
  };

  const hexId = a.id.toString(16).padStart(24, "0");
  doc._id = new mongoose.Types.ObjectId(hexId);
  return doc;
});


// 插入 Labels 并构建 labelMap
const insertedLabels = await Label.insertMany(labelsDocs);
console.log("✅ Labels inserted");
const labelMap = {};
labels.forEach((label) => {
  const matched = insertedLabels.find((doc) => doc.name === label.name);
  if (matched) {
    labelMap[label.id] = new mongoose.Types.ObjectId(matched._id);
  }
});

console.log("🔍 labelMap content:", labelMap);
console.log("✅ labelMap types:", Object.entries(labelMap).map(([k, v]) => [k, typeof v]));

// 插入新数据
console.log("📦 正在准备插入 Bills");
// console.log(
//   bills.map(b => ({
//     ...b,
//     groupId: groupMap[b.groupId],
//   })));


  // ✅💥 在插入 Bills 之前，把每条账单的 labelId 从数字变成 ObjectId
  const fixedBills = bills.map(b => ({
    groupId: groupMap[b.groupId], // 原来的 groupId 替换成新的 ObjectId
    groupBills: (b.groupBills || []).map(gb => ({
      ...gb,
      labelId: labelMap[gb.labelId],
      paidBy: userIdMap[gb.paidBy],
    })),
  }));

  // ✅ 验证 labelId 是否转换成 ObjectId
  console.log("🧾 converted labelIds:", fixedBills[0].groupBills.map(g => typeof g.labelId));
    


    // 插入新数据
    await Promise.all([
      Balance.insertMany(calculatedBalances),

      Bill.insertMany(fixedBills),
      
      Icon.insertMany(icons),
      // Label.insertMany(labels),
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
