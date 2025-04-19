import { Group } from "../db/schema.js";
import { User } from "../db/schema.js";
import mongoose from "mongoose";

const ObjectId = mongoose.Types.ObjectId;

// Get all groups for a user
export const getUserGroups = async (req, res) => {
  try {

    if (!req.user || !req.user.groupId || !Array.isArray(req.user.groupId)) {
      console.log('user.groupId before signing JWT:', user.groupId);
      console.log('req.user:', req.user);
      console.warn(`User ${req.user?._id || 'unknown'} missing groupId array.`);
      return res.status(400).json({ message: 'User group information not found or invalid.' });
    }

    const userGroupIds = req.user.groupId.map(id => ObjectId(id));
    if (userGroupIds.length === 0) return res.json([]);

    const groups = await Group.find({ _id: { $in: userGroupIds } }).sort({ startDate: -1 });
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
