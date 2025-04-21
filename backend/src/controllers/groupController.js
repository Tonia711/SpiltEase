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

  if (!joinCode || typeof joinCode !== 'string') {
    return res.status(400).json({ message: "Valid join code is required" });
  }

  try {
    const group = await Group.findOne({ joinCode: joinCode.trim() }).select("_id groupName members");
    if (!group) {
      return res.status(404).json({ message: "Invalid code" });
    }
    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const joinGroupByCode = async (req, res) => {
  const { joinCode, selectedMemberId } = req.body;
  const currentUserId = req.user.id;
  const currentUserName = req.user.username;

  if (!joinCode || typeof joinCode !== 'string') {
    return res.status(400).json({ message: "Join code is required" });
  }

  try {
    const group = await Group.findOne({ joinCode: joinCode.trim() });
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    console.log("Group found:", group._id, group.groupName);
    console.log("Group members:", group.members);
    console.log("Current user ID:", currentUserId);
    const alreadyMember = group.members.some(member =>
      member.userId && member.userId.equals(currentUserId)
    );
    if (alreadyMember) {
      return res.status(409).json({ message: "You are already a member of this group." });
    }

    let actionMessage = "Joined group successfully";
    let finalMemberId = null;

    if (selectedMemberId !== undefined && selectedMemberId !== null) {
      const virtualMember = group.members.find(
        m => m.memberId === selectedMemberId && !m.userId
      );

      if (!virtualMember) {
        return res.status(400).json({ message: "Invalid or already claimed memberId" });
      }

      virtualMember.userId = currentUserId;
      virtualMember.userName = currentUserName;
      finalMemberId = virtualMember.memberId;
      actionMessage = "Claimed virtual member successfully";

      await group.save();

    } else {

      const newMember = {
        memberId: group.members.length > 0 ? Math.max(...group.members.map(m => m.memberId)) + 1 : 1,
        userName: currentUserName,
        userId: currentUserId,
      };

      group.members.push(newMember);
      finalMemberId = newMember.memberId;
      actionMessage = "Joined group as a new member successfully";

      await group.save();
    }

    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { groupId: group._id },
    });

    res.status(201).json({
      message: actionMessage,
      groupId: group._id,
      groupName: group.groupName,
      memberId: finalMemberId,
    });

  } catch (error) {
    console.error("Error joining group by code:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateGroupInfo = async (req, res) => {
  const groupId = req.params.id;
  const { groupName, note, iconId, budget, startDate, endDate } = req.body;

  try {
    const group = await Group
      .findByIdAndUpdate(
        groupId,
        {
          groupName,
          note,
          iconId,
          budget,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
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