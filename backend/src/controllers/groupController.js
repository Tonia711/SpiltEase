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

// Validate join code
export const validateJoinCode = async (req, res) => {
  const { joinCode } = req.body;
  const currentUserId = req.user.id;

  if (!joinCode || typeof joinCode !== "string") {
    return res.status(400).json({ message: "Valid join code is required" });
  }

  try {
    const group = await Group.findOne({ joinCode: joinCode.trim() }).select(
      "_id groupName members"
    );
    if (!group) {
      return res.status(404).json({ message: "Invalid code" });
    }

    const user = await User.findById(currentUserId).select("_id groupId");

    const isInGroupMembers = group.members.some(
      (member) => member.userId && member.userId.equals(currentUserId)
    );

    const isInUserGroupList = user.groupId.some((aGroupId) =>
      aGroupId.equals(group._id)
    );

    if (isInGroupMembers && isInUserGroupList) {
      return res.status(200).json({
        message: "You are already a member of this group.",
        isAlreadyMember: true,
        canRejoin: false,
        group,
      });
    }

    if (isInGroupMembers && !isInUserGroupList) {
      return res.status(200).json({
        message: "You have been in this group, would you like to rejoin?",
        isAlreadyMember: true,
        canRejoin: true,
        group,
      });
    }

    return res.status(200).json({
      message: "Validate code!",
      isAlreadyMember: false,
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

// join a group by code
export const joinGroupByCode = async (req, res) => {
  const { joinCode, selectedMemberId } = req.body;
  const currentUserId = req.user.id;
  const user = await User.findById(currentUserId).select("userName");

  if (!user) {
    return res.status(404).json({ message: "Authenticated user not found" });
  }

  if (!joinCode || typeof joinCode !== "string") {
    return res.status(400).json({ message: "Join code is required" });
  }

  try {
    const group = await Group.findOne({ joinCode: joinCode.trim() }).populate(
      "members"
    );
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const alreadyMember = group.members.some(
      (member) => member.userId && member.userId.equals(currentUserId)
    );

    if (alreadyMember) {
      if (!user.groupId || !user.groupId.includes(group._id.toString())) {
        await User.findByIdAndUpdate(currentUserId, {
          $addToSet: { groupId: group._id },
        });

        await Group.updateOne(
          { _id: group._id, "members.userId": currentUserId },
          { $set: { "members.$.isHidden": false } }
        );

        return res.status(200).json({
          message:
            "You were previously a member of this group. Your membership has been restored.",
          groupId: group._id,
          groupName: group.groupName,
        });
      } else {
        return res
          .status(409)
          .json({ message: "You are already a member of this group." });
      }
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

    if (selectedMemberId !== undefined && selectedMemberId !== null) {
      const virtualMember = group.members.find(
        (m) => String(m._id) === String(selectedMemberId) && !m.userId
      );

      if (!virtualMember) {
        return res
          .status(400)
          .json({ message: "Invalid or already claimed memberId" });
      }

      virtualMember.userId = currentUserId;
      virtualMember.userName = user.userName;
      virtualMember.isVirtual = false;

      await group.save();

      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { groupId: group._id },
      });

      res.status(201).json({
        message: "Claimed virtual member successfully",
        groupId: group._id,
        groupName: group.groupName,
        _id: virtualMember._id,
      });
    } else {
      const newMember = {
        memberId:
          group.members.length > 0
            ? Math.max(...group.members.map((m) => m.memberId)) + 1
            : 1,
        userName: user.userName,
        userId: currentUserId,
        isVirtual: false,
      };

      group.members.push(newMember);

      await group.save();

      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { groupId: group._id },
      });

      res.status(201).json({
        message: "Joined group as a new member successfully",
        groupId: group._id,
        groupName: group.groupName,
        memberId: newMember.memberId,
      });
    }
  } catch (error) {
    console.error("Error joining group by code:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// update group Icon
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

// checke if the member deletable
export const checkMemberdeletable = async (req, res) => {
  const groupId = req.params.id;
  const memberObjectIdStr = req.params.memberId;

  if (!mongoose.Types.ObjectId.isValid(memberObjectIdStr)) {
    return res.status(400).json({ message: "Invalid member ID" });
  }

  const memberObjectId = new mongoose.Types.ObjectId(memberObjectIdStr);

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const member = group.members.find(
      (m) => m._id.toString() === memberObjectIdStr
    );
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    const unsettledBalances = await Balance.find({
      groupId: groupId,
      groupBalances: {
        $elemMatch: {
          $or: [
            { fromMemberId: memberObjectId },
            { toMemberId: memberObjectId },
          ],
          balance: { $gt: 0.0001 },
          isFinished: false,
        },
      },
    });

    if (unsettledBalances.length > 0) {
      return res.status(400).json({
        message: "Member cannot be deleted due to unsettled balance.",
      });
    }

    return res.status(200).json({ message: "Member can be deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// update group info
export const updateGroupInfo = async (req, res) => {
  const currentGroupId = req.params.id;
  const { groupName, startDate, members: incomingMembers } = req.body;

  if (!groupName || !incomingMembers) {
    return res
      .status(400)
      .json({ message: "Group name and members list are required." });
  }

  try {
    const group = await Group.findById(currentGroupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    group.groupName = groupName;
    group.startDate = startDate ? new Date(startDate) : null;

    const currentMembers = group.members.toObject();

    // Filter incoming members to identify those with and without memberId
    const incomingMembersWithId = incomingMembers.filter(m => m._id).map(m => ({
      _id: m._id,
      userId: m.userId,
      userName: m.userName,
      isHidden: m.isHidden || false,
    }));
    const incomingMembersWithoutId = incomingMembers.filter((m) => !m._id); // These are the new members from frontend preview

    const incomingMemberIds = new Set(
      incomingMembersWithId.map((m) => m._id.toString())
    );

    // Identify members marked for deletion (exist in current but not in incoming with ID)
    const membersToDelete = incomingMembersWithId.filter(m => m.isHidden);

    for (const memberToDelete of membersToDelete) {
      const unsettledBalances = await Balance.find({
        groupId: currentGroupId,
        groupBalances: {
          $elemMatch: {
            $or: [
              { fromMemberId: memberToDelete._id },
              { toMemberId: memberToDelete._id },
            ],
            balance: { $gt: 0.0001 },
            isFinished: false,
          },
        },
      });

      if (unsettledBalances.length > 0) {
        return res.status(400).json({
          message: `Cannot delete member '${memberToDelete.userName}' due to unsettled balances. Please settle balances before removing.`,
        });
      } else {
        memberToDelete.isHidden = true;
        await User.updateOne(
          { _id: memberToDelete.userId },
          { $pull: { groupId: currentGroupId } },
        );
      }
    }

    const newMembersArray = [];

    for (const member of currentMembers) {
      if (incomingMemberIds.has(member._id.toString())) {
        const incoming = incomingMembersWithId.find(
          (m) => m._id.toString() === member._id.toString()
        );
        newMembersArray.push({
          _id: member._id,
          userName: incoming?.userName?.trim() || member.userName,
          userId: member.userId,
          isHidden: incoming?.isHidden ?? member.isHidden,
          isVirtual: incoming?.isVirtual ?? member.isVirtual
        });
      }
    }
    // Add new members
    for (const newMember of incomingMembersWithoutId) {
      if (!newMember.userName || newMember.userName.trim() === "") {
        continue;
      }
      newMembersArray.push({
        _id: new mongoose.Types.ObjectId(),
        userName: newMember.userName.trim(),
      });
    }

    // Update the group's members array with the new list
    group.members = newMembersArray;

    // Save the updated group document
    await group.save();

    res.status(200).json(group);
  } catch (err) {
    console.error("Error updating group:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Server error updating group." });
  }
};

function generateJoinCode(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const createGroup = async (req, res) => {
  const { groupName, startDate, members } = req.body;
  const currentUserId = req.user.id;

  if (!groupName || !Array.isArray(members) || members.length === 0) {
    return res
      .status(400)
      .json({ message: "Group name and members are required." });
  }

  try {
    let joinCode;
    let codeExists = true;
    while (codeExists) {
      joinCode = generateJoinCode();
      const existingGroup = await Group.findOne({ joinCode });
      codeExists = !!existingGroup;
    }

    const newGroup = new Group({
      groupName,
      startDate: startDate ? new Date(startDate) : null,
      joinCode,
      members: members.map((m, idx) => ({
        memberId: idx + 1, 
        userName: m.userName,
        userId: m.userId || null,
        isVirtual: m.userId ? false : true,
      })),
      budget: 0,
      totalExpenses: 0,
      totalRefunds: 0,
    });

    const savedGroup = await newGroup.save();

    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { groupId: savedGroup._id },
    });

    res.status(201).json({
      message: "Group created successfully",
      group: savedGroup,
    });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Server error while creating group" });
  }
};
