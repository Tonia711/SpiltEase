import { Group, User, Icon, Balance } from "../db/schema.js";
import mongoose from "mongoose";

// Get all groups for a user
export const getUserGroups = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("groupId");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.groupId || !Array.isArray(user.groupId)) {
      console.warn(`User ${req.user.id} missing groupId array.`);
      return res
        .status(400)
        .json({ message: "User group information not found or invalid." });
    }

    console.log("User groupId array content:", user.groupId);

    const groups = await Group.find({ _id: { $in: user.groupId } }).sort({
      startDate: -1,
    });
    const groupsWithIcons = await Promise.all(
      groups.map(async (group) => {
        let iconUrl = "groups/defaultIcon.jpg";
        if (group.iconId) {
          const icon = await Icon.findById(group.iconId).select("iconUrl");
          iconUrl = icon?.iconUrl || iconUrl;
        }
        return {
          ...group.toObject(),
          iconUrl,
        };
      })
    );

    res.json(groupsWithIcons);
  } catch (err) {
    console.error("Error fetching user's groups:", err);
    res
      .status(500)
      .json({ message: "Server error while fetching user's groups" });
  }
};

// Delete a group
export const deleteGroup = async (req, res) => {
  try {
    const groupIdToRemove = req.params.id;

    const user = await User.findById(req.user.id).select("groupId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.groupId || !Array.isArray(user.groupId)) {
      return res
        .status(400)
        .json({ message: "User group list not found or invalid" });
    }

    const hasGroup = user.groupId.some(
      (id) => id.toString() === groupIdToRemove
    );

    if (!hasGroup) {
      return res
        .status(403)
        .json({ message: "User is not a member of this group." });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { groupId: groupIdToRemove },
    });

    res.json({ message: "Group removed from user successfully" });
  } catch (err) {
    console.error("Error deleting group:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid group ID format" });
    }
    res.status(500).json({ message: "Server error while deleting group" });
  }
};

// Get a specific group
export const getGroupById = async (req, res) => {
  const groupId = req.params.id;

  try {
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    let iconUrl = null;
    if (group.iconId) {
      const icon = await Icon.findById(group.iconId).select("iconUrl");
      iconUrl = icon ? icon.iconUrl : "groups/defaultIcon.jpg";
    }

    res.status(200).json({
      ...group.toObject(),
      iconUrl,
    });
  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const validateJoinCode = async (req, res) => {
  try {
    const { joinCode } = req.body;

    if (!joinCode || typeof joinCode !== "string") {
      return res.status(400).json({ message: "Valid join code is required" });
    }
    const group = await Group.findOne({ joinCode: joinCode.trim() }).select(
      "_id groupName members._id members.userName members.userId"
    );

    if (!group) {
      return res.status(404).json({ message: "Invalid code" });
    }

    const user = await User.findById(req.user.id);
    const inMembers = group.members.some((m) => m.userId?.equals(req.user.id));
    const inUserGroup = user.groupId.some((gId) => gId.equals(group._id));

    return res.status(200).json({
      message: inMembers
        ? inUserGroup
          ? "Already in group"
          : "Rejoin?"
        : "Code valid",
      isAlreadyMember: inMembers,
      canRejoin: inMembers && !inUserGroup,
      group,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

function getUniqueName(baseName, existingMembers) {
  let name = baseName;
  let count = 1;
  const existingNames = new Set(existingMembers.map((m) => m.userName));
  while (existingNames.has(name)) {
    name = `${baseName}-${count++}`;
  }
  return name;
}

export const joinGroupByCode = async (req, res) => {
  try {
    const { joinCode, selectedMemberId } = req.body;
    const user = await User.findById(req.user.id).select("userName groupId");
    if (!user) return res.status(404).json({ message: "User not found" });
    const group = await Group.findOne({ joinCode: joinCode?.trim() });
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isInMembers = group.members.some((m) =>
      m.userId?.equals(req.user.id)
    );
    const isInUserGroup = user.groupId?.some((gId) => gId.equals(group._id));

    if (isInMembers && isInUserGroup) {
      return res.status(409).json({ message: "Already a member" });
    }

    if (isInMembers && !isInUserGroup) {
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { groupId: group._id },
      });
      return res.status(200).json({ message: "Rejoined", groupId: group._id });
    }

    const nameConflictMember = group.members.find(
      (m) =>
        !m.userId &&
        m.userName.toLowerCase() === user.userName.toLowerCase() &&
        (!selectedMemberId || m._id.toString() !== selectedMemberId)
    );
    if (nameConflictMember) {
      const newName = getUniqueName(
        `${nameConflictMember.userName}-old`,
        group.members
      );
      nameConflictMember.userName = newName;
    }

    if (selectedMemberId) {
      const target = group.members.id(selectedMemberId);
      if (!target || target.userId)
        return res.status(400).json({ message: "Invalid member" });
      target.userId = req.user.id;
      target.userName = user.userName;
      target.isVirtual = false;
    } else {
      group.members.push({
        userId: req.user.id,
        userName: user.userName,
        isVirtual: false,
      });
    }

    await group.save();
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { groupId: group._id },
    });
    res.status(201).json({ message: "Joined", groupId: group._id });
  } catch (error) {
    console.error("Join error", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateGroupIcon = async (req, res) => {
  try {
    const { groupId } = req.body;
    const filePath = `groups/${req.file.filename}`;

    const newIcon = await Icon.create({
      iconUrl: filePath,
    });

    await Group.findByIdAndUpdate(groupId, {
      iconId: newIcon._id,
    });

    res.status(201).json({
      message: "Icon uploaded",
      iconId: newIcon._id,
      iconUrl: filePath,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
};

export const checkMemberDeletable = async (req, res) => {
  const { id: groupId, memberId: memberObjectId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(groupId) ||
    !mongoose.Types.ObjectId.isValid(memberObjectId)
  ) {
    return res.status(400).json({ message: "Invalid id format." });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    const member = group.members.id(memberObjectId);
    if (!member) return res.status(404).json({ message: "Member not found." });

    // 可选：禁止删除真实用户
    // if (member.userId)
    //   return res.status(403).json({ message: "Cannot delete real user." });

    const hasUnsettled = await Balance.exists({
      groupId,
      groupBalances: {
        $elemMatch: {
          $or: [{ fromMemberId: member._id }, { toMemberId: member._id }],
          balance: { $gt: 0.0001 },
          isFinished: false,
        },
      },
    });

    if (hasUnsettled)
      return res.status(400).json({
        message: "Member cannot be deleted due to unsettled balance.",
      });

    return res.status(200).json({ message: "Member can be deleted." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

export const updateGroupInfo = async (req, res) => {
  const { id: groupId } = req.params;
  const { groupName, startDate, members: incoming } = req.body;

  if (!groupName || !Array.isArray(incoming))
    return res.status(400).json({ message: "Group name & members required." });

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    group.groupName = groupName;
    group.startDate = startDate ? new Date(startDate) : null;

    /* --- 现有成员 Map<id, doc> --- */
    const currentMap = new Map(group.members.map((m) => [m._id.toString(), m]));

    /* --- 要保留/更新的成员 --- */
    const nextMembers = [];

    /* 1️⃣ 处理前端传回的每个成员 */
    for (const m of incoming) {
      if (m._id) {
        // ← 前端传现有成员
        if (!currentMap.has(m._id))
          return res.status(400).json({ message: "Member id mismatch." });

        const cur = currentMap.get(m._id);
        cur.userName = m.userName?.trim() || cur.userName; // 可改名
        nextMembers.push(cur);
        currentMap.delete(m._id); // 剩下的是待删除的
      } else if (m.userName?.trim()) {
        // ← 全新成员（无 _id）
        nextMembers.push({
          userName: m.userName.trim(),
          isVirtual: true,
        }); // 让 Mongoose 自动生成 _id
      }
    }

    /* 2️⃣ 检查要删除的成员是否还有未结算余额 */
    for (const member of currentMap.values()) {
      const hasUnsettled = await Balance.exists({
        groupId,
        groupBalances: {
          $elemMatch: {
            $or: [{ fromMemberId: member._id }, { toMemberId: member._id }],
            balance: { $gt: 0.0001 },
            isFinished: false,
          },
        },
      });
      if (hasUnsettled)
        return res.status(400).json({
          message: `Cannot delete '${member.userName}' due to unsettled balances.`,
        });
    }

    /* 3️⃣ 覆盖成员数组并保存 */
    group.members = nextMembers;
    await group.save();

    res.status(200).json(group.toObject({ versionKey: false }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error updating group." });
  }
};

export const addNewVirtualMember = async (req, res) => {
  const { id: groupId } = req.params;
  const { userName } = req.body;

  if (!userName?.trim())
    return res.status(400).json({ message: "User name is required." });

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    group.members.push({ userName: userName.trim(), isVirtual: true }); // 自动生成 _id
    await group.save();

    res.status(201).json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
export const deleteGroupMember = async (req, res) => {
  const { id: groupId, memberId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    return res.status(400).json({ message: "Invalid member ID" });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const member = group.members.id(memberId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // 若已绑定真实用户，禁止删除
    if (member.userId) {
      return res
        .status(403)
        .json({ message: "Cannot delete a real‑user member." });
    }

    // 未结余额检查
    const hasUnsettled = await Balance.exists({
      groupId,
      groupBalances: {
        $elemMatch: {
          $or: [{ fromMemberId: member._id }, { toMemberId: member._id }],
          balance: { $gt: 0.0001 },
          isFinished: false,
        },
      },
    });

    if (hasUnsettled) {
      return res.status(400).json({
        message: "Member cannot be deleted due to unsettled balance.",
      });
    }

    // 真正删除
    member.deleteOne(); // 等价 group.members.pull(memberId)
    await group.save();

    return res.status(200).json(group);
  } catch (err) {
    console.error("deleteGroupMember error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper：生成随机 joinCode
function generateJoinCode(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const createGroup = async (req, res) => {
  try {
    let joinCode;
    do {
      joinCode = generateJoinCode();
    } while (await Group.findOne({ joinCode }));

    const newGroup = new Group({
      groupName: req.body.groupName,
      startDate: req.body.startDate ? new Date(req.body.startDate) : null,
      joinCode,
      members: req.body.members.map((m) => ({
        userName: m.userName,
        userId: m.userId || null,
        isVirtual: m.userId ? false : true,
      })),
      budget: 0,
      totalExpenses: 0,
      totalRefunds: 0,
    });

    const savedGroup = await newGroup.save();
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { groupId: savedGroup._id },
    });
    res.status(201).json({ message: "Group created", group: savedGroup });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};
