import { Group } from "../db/schema.js";
import { User } from "../db/schema.js";
import { Icon } from "../db/schema.js";
import mongoose from "mongoose";

// Get all groups for a user
export const getUserGroups = async (req, res) => {

  try {
    const user = await User.findById(req.user.id).select('groupId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.groupId || !Array.isArray(user.groupId)) {
      console.warn(`User ${req.user.id} missing groupId array.`);
      return res.status(400).json({ message: 'User group information not found or invalid.' });
    }

    console.log('User groupId array content:', user.groupId);

    const groups = await Group.find({ _id: { $in: user.groupId } }).sort({ startDate: -1 });
    res.json(groups);
  } catch (err) {
    console.error("Error fetching user's groups:", err);
    res.status(500).json({ message: "Server error while fetching user's groups" });
  }
};

// Delete a group
export const deleteGroup = async (req, res) => {
  try {
    const groupIdToRemove = req.params.id;

    const user = await User.findById(req.user.id).select('groupId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.groupId || !Array.isArray(user.groupId)) {
      return res.status(400).json({ message: 'User group list not found or invalid' });
    }

    const hasGroup = user.groupId.some(
      id => id.toString() === groupIdToRemove
    );

    if (!hasGroup) {
      return res.status(403).json({ message: 'User is not a member of this group.' });
    }

    await User.findByIdAndUpdate(req.user.id, { $pull: { groupId: groupIdToRemove } });

    res.json({ message: 'Group removed from user successfully' });

  } catch (err) {
    console.error('Error deleting group:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid group ID format' });
    }
    res.status(500).json({ message: 'Server error while deleting group' });
  }
};

// Get a specific group
export const getGroupById = async (req, res) => {
  const groupId = req.params.id;

  try {
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    let iconUrl = null;
    if (group.iconId) {
      const icon = await Icon.findById(group.iconId).select('iconUrl');
      iconUrl = icon ? icon.iconUrl : "groups/testIcon1.jpg";
    }

    res.status(200).json({
      ...group.toObject(),
      iconUrl,
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const validateJoinCode = async (req, res) => {
  const { joinCode } = req.body;
  const currentUserId = req.user.id;

  if (!joinCode || typeof joinCode !== 'string') {
    return res.status(400).json({ message: "Valid join code is required" });
  }

  try {
    const group = await Group.findOne({ joinCode: joinCode.trim() }).select("_id groupName members");
    if (!group) {
      return res.status(404).json({ message: "Invalid code" });
    }

    const user = await User.findById(currentUserId).select("_id groupId");

    const isInGroupMembers = group.members.some(member =>
      member.userId && member.userId.equals(currentUserId)
    );

    const isInUserGroupList = user.groupId.some(aGroupId =>
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

export const joinGroupByCode = async (req, res) => {
  const { joinCode, selectedMemberId } = req.body;
  const currentUserId = req.user.id;
  const user = await User.findById(currentUserId).select('userName');

  if (!user) {
    return res.status(404).json({ message: 'Authenticated user not found' });
  }

  if (!joinCode || typeof joinCode !== 'string') {
    return res.status(400).json({ message: "Join code is required" });
  }

  try {
    const group = await Group.findOne({ joinCode: joinCode.trim() }).populate("members");
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const alreadyMember = group.members.some(member =>
      member.userId && member.userId.equals(currentUserId)
    );

    if (alreadyMember) {
      if (!user.groupId || !user.groupId.includes(group._id.toString())) {
        await User.findByIdAndUpdate(currentUserId, {
          $addToSet: { groupId: group._id },
        });

        return res.status(200).json({
          message: "You were previously a member of this group. Your membership has been restored.",
          groupId: group._id,
          groupName: group.groupName,
        });
      } else {
        return res.status(409).json({ message: "You are already a member of this group." });
      }
    }

    const nameConflictMember = group.members.find(
      (m) =>
        !m.userId &&
        m.userName.toLowerCase() === user.userName.toLowerCase() &&
        (!selectedMemberId || m._id.toString() !== selectedMemberId)
    );

    if (nameConflictMember) {
      const newName = getUniqueName(`${nameConflictMember.userName}-old`, group.members);
      nameConflictMember.userName = newName;
    }

    if (selectedMemberId !== undefined && selectedMemberId !== null) {
      const virtualMember = group.members.find(
        m => String(m.memberId) === String(selectedMemberId) && !m.userId
      );

      if (!virtualMember) {
        return res.status(400).json({ message: "Invalid or already claimed memberId" });
      }

      virtualMember.userId = currentUserId;
      virtualMember.userName = user.userName;

      await group.save();

      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { groupId: group._id },
      });

      res.status(201).json({
        message: "Claimed virtual member successfully",
        groupId: group._id,
        groupName: group.groupName,
        memberId: virtualMember.memberId,
      });

    } else {

      const newMember = {
        memberId: group.members.length > 0 ? Math.max(...group.members.map(m => m.memberId)) + 1 : 1,
        userName: user.userName,
        userId: currentUserId,
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

export const checkMemberdeletable = async (req, res) => {
  const groupId = req.params.id;
  const memberId = parseInt(req.params.memberId, 10);

  if (isNaN(memberId)) {
    return res.status(400).json({ message: 'Invalid member ID' });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const member = group.members.find(m => m.memberId === memberId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }
    
    if (!memberToDelete) {
      return res.status(404).json({ message: "Member not found" });
    }

    if (memberToDelete.balance > 0) {
      return res.status(400).json({ message: "Member cannot be deleted due to non-zero balance." });
    }

    res.status(200).json({ message: "Member can be deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateGroupInfo = async (req, res) => {
  const groupId = req.params.id;
  const { groupName, startDate, members } = req.body;

  if (!groupName || !startDate || !Array.isArray(members)) {
    return res.status(400).json({ message: "Invalid request data." });
  }

  let session;

  try {
    const group = await Group.findById(groupId).populate('members');

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    group.groupName = groupName;
    group.startDate = new Date(startDate);

    const existingMembers = group.members.map(m => m.userId);
    const incomingMembers = members.map(m => m.userId).filter(userId => userId);
    const newMembersData = members.filter(m => !m.userId);

    const membersTodeleteIds = existingMembers.filter(userId => !incomingMembers.includes(userId));

    const membersToDelete = [];
    const undeletableMembers = [];

    for (const memberId of membersTodeleteIds) {
      const member = group.members.find(m => m.userId && m.userId.equals(memberId));
      if (member) {
        if (member.balance === 0) {
          undeletableMembers.push(member.memberName || `ID: ${member.id}`);
        } else {
          membersToDelete.push(member);
        }
      }

      if (undeletableMembers.length > 0) {
        return res.status(400).json({ message: `Cannot delete members with non-zero balance: ${undeletableMembers.join(", ")}` });
      }
    }


    res.status(200).json(group);
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

const updateGroupIcon = async (req, res) => {
  const groupId = req.params.id;
  const { iconId } = req.body;

  try {
    const group = await Group.findByIdAndUpdate(
      groupId,
      { iconId },
      { new: true }
    ).select("-__v");
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    res.status(200).json(group);
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

const deleteGroupMember = async (req, res) => {
  const groupId = req.params.id;
  const memberId = req.params.memberId;

  try {
    const group = await Group
      .findByIdAndUpdate(
        groupId,
        { $pull: { members: { memberId } } },
        { new: true }
      )
      .select("-__v");
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    res.status(200).json(group);
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}


// Create group
export const createGroup = (req, res) => {
  res.send("Create group API");
};