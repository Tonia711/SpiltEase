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

    // Step 1: 插入 Icons 并生成 iconMap
    const iconDocs = icons.map((i) => {
      const doc = {
        iconUrl: i.iconUrl,
      };

      if (i.id && i.id <= 100) {
        const hexId = i.id.toString(16).padStart(24, "0");
        doc._id = new mongoose.Types.ObjectId(hexId);
        i._id = doc._id;
      }

      return doc;
    });

    const insertedIcons = await Icon.insertMany(iconDocs);
    console.log("✅ Icons inserted");

    const iconMap = {};
    icons.forEach((i) => {
      const matched = insertedIcons.find((doc) => doc.iconUrl === i.iconUrl);
      if (matched) {
        iconMap[i.id] = matched._id;
      }
    });

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
        insertedAvatars.find((doc) => doc.avatarUrl === a.avatarUrl)._id ||
        a._id;
    });

    const userDocs = [];
    const userIdMap = {};

    for (const u of users) {
      const hashedPassword = await bcrypt.hash(u.password, 10);

      let userObjectId;
      if (u.id && u.id <= 10) {
        // 写死ID：前10个测试用户，固定ID
        const hexId = u.id.toString(16).padStart(24, "0");
        userObjectId = new Types.ObjectId(hexId);
      } else {
        userObjectId = new Types.ObjectId(); // 其他正常生成
      }

      userDocs.push({
        _id: userObjectId,
        userName: u.userName,
        email: u.email,
        password: hashedPassword,
        avatarId: avatarMap[u.avatarId],
        // groupId 稍后补
      });

      userIdMap[u.id] = userObjectId; // 保存id映射
    }

    await User.insertMany(userDocs);
    console.log("✅ Users inserted and userIdMap created");

    const groupMap = {};
    const virtualUserIdMap = {};
    const groupDocs = groups.map((g) => {
      const groupObjectId = new Types.ObjectId();
      groupMap[g.id] = groupObjectId;

      return {
        _id: groupObjectId,
        groupName: g.groupName,
        note: g.note || "",
        iconId: iconMap[g.iconId] || 0,
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
            const virtualId = new Types.ObjectId();
            memberDoc.userId = virtualId;
            virtualUserIdMap[m.memberId] = virtualId;
          } else {
            memberDoc.userId = userIdMap[m.userId] || null;
          }
          return memberDoc;
        }),
      };
    });

    await Group.insertMany(groupDocs);
    console.log("✅ Groups inserted and groupMap created");

    const userUpdates = users
      .map((u) => {
        const groupObjectIds = (u.groupId || [])
          .map((groupId) => groupMap[groupId])
          .filter((id) => id); // 映射原始groupId到ObjectId，过滤掉null
        return {
          updateOne: {
            filter: { _id: userIdMap[u.id] },
            update: { $set: { groupId: groupObjectIds } },
          },
        };
      })
      .filter((update) => update.updateOne.filter._id);

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
      const matched = insertedLabels.find((doc) => doc.type === label.type);
      if (matched) {
        labelMap[label.id] = matched._id;
      }
    });

    // 获取所有 Group 文档，并构建 groupId -> memberId 对应 member._id 的映射
    const allGroups = await Group.find();
    const groupMemberIdToObjectIdMap = {}; // 结构：{ groupId: { memberId: member._id } }

    allGroups.forEach((group) => {
      const memberMap = {};
      group.members.forEach((member) => {
        memberMap[member.memberId] = member._id; // 注意这里是 member._id，不是 userId
      });
      groupMemberIdToObjectIdMap[group._id.toString()] = memberMap;
    });

    // 构造 fixedBills，并转换成员的 memberId 为 MongoDB 的 ObjectId
    const fixedBills = bills.map((b) => {
      const realGroupId = groupMap[b.groupId]; // 从 groupMap 中拿真实 group ObjectId
      const memberIdMap =
        groupMemberIdToObjectIdMap[realGroupId.toString()] || {};

      return {
        groupId: realGroupId,
        groupBills: (b.groupBills || []).map((gb) => ({
          ...gb,
          labelId: labelMap[gb.labelId], // 替换为 labels _id
          paidBy: memberIdMap[gb.paidBy],
          members: gb.members.map((m) => ({
            memberId: memberIdMap[m.memberId], // 替换为 groups members _id
            expense: m.expense,
            refund: m.refund,
          })),
        })),
      };
    });

    const originalBillsForBalanceCalculation = bills.map((b) => ({
      ...b,
      groupBills: b.groupBills.map((gb) => ({
        ...gb,
        members: gb.members.map((m) => ({ ...m })),
      })),
    }));

    const calculatedBalances = getMinimalTransfers(
      originalBillsForBalanceCalculation
    );

    const fixedBalances = calculatedBalances.map((groupBalance) => {
      const realGroupId = groupMap[groupBalance.groupId];
      const memberIdMap =
        groupMemberIdToObjectIdMap[realGroupId.toString()] || {};

      return {
        groupId: realGroupId,
        groupBalances: groupBalance.groupBalances.map((b) => {
          const fromId = memberIdMap[b.fromMemberId] ?? null;
          const toId = memberIdMap[b.toMemberId] ?? null;
          return {
            fromMemberId: fromId,
            toMemberId: toId,
            balance: b.balance,
            isFinished: false,
            finishHistory: [],
          };
        }),
      };
    });

    // 插入新数据
    await Promise.all([
      Balance.insertMany(fixedBalances),
      Bill.insertMany(fixedBills),
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
