import { Group } from "../db/schema.js";
import { User } from "../db/schema.js";
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
    const groupId = req.params.id;

    if (!req.user.groupId.some(id => id == groupId)) {
      return res.status(403).json({ message: 'User is not a member of this group.' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    await User.findByIdAndUpdate(req.user._id, { $pull: { groupId: groupId } });

    res.json({ message: 'Group removed successfully' });

  } catch (err) {
    console.error('Error deleting group:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid group ID format' });
    }
    res.status(500).json({ message: 'Server error while deleting group' });
  }
};

// Create group
export const createGroup = (req, res) => {
  res.send("Create group API");
};

// Get a specific group
export const getGroupById = (req, res) => {
  res.send("Get specific group API");
};
