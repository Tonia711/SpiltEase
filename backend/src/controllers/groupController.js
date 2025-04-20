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

export const createGroupMember = async (req, res) => {
  const groupId = req.params.id;
  const currentUserId = req.user._id;
  const currentUserName = req.user.username;

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return res.status(400).json({ message: "Invalid group ID format." });
  }

  try {
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    const isUserAlreadyLinked = group.members.some(member =>
      member.userId && member.userId.equals(currentUserId)
    );

    if (isUserAlreadyLinked) {
      return res.status(409).json({ message: "You are already a member of this group." });
    }

    const newMember = {
      memberId: group.members.length + 1,
      userName: currentUserName,
      userId: currentUserId,
    };

    group.members.push(newMember);
    await group.save();

    res.status(201).json({ message: "Joined group successfully", memberId: newMember.memberId });

  } catch (error) {
    console.error("Error creating group member:", error);
    res.status(500).json({ message: "Server error creating group member." });
  }
};

export const joinGroup = async (req, res) => {
  const groupId = req.params.id;
  const { memberId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return res.status(400).json({ message: "Invalid group ID" });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const member = group.members.find((m) => m.memberId === memberId);
    if (!member) return res.status(404).json({ message: "Member not found" });

    if (member.user) {
      return res.status(400).json({ message: "This member is already claimed" });
    }

    member.userName = req.user.userName;
    member.userId = req.user.id;

    await group.save();

    console.log("user", req.user.id);

    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { groupId: group._id },
    });

    res.json({ message: "Joined group successfully", group });
  } catch (err) {
    console.error(err);
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