import express from "express";
import { Group } from "../../../db/schema.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

// Get all groups for the user
router.get("/", protect, async (req, res) => {
  try {
    if (!req.user || !req.user.groupId || !Array.isArray(req.user.groupId)) {
      console.warn(`User ${req.user?._id || 'unknown'} missing groupId array.`);
      return res.status(400).json({ message: 'User group information not found or invalid.' });
    }

    const userGroupIds = req.user.groupId;
    console.log(`DEBUG: Querying groups with IDs: ${JSON.stringify(userGroupIds)} for user ${req.user._id}`);
    if (userGroupIds.length === 0) {
      return res.json([]);
    }

    const groups = await Group.find({
      _id: { $in: userGroupIds }
    }).sort({ startDate: -1 });

    console.log('Groups found in DB:', groups.map(g => g._id)); 
    res.json(groups);
  } catch (err) {
    console.error("Error fetching user's groups by groupId:", err);
    res.status(500).json({ message: "Server error while fetching user's groups" });
  }
});

// Delete a group
router.delete('/:id', protect, async (req, res) => {
  try {
    const groupId = req.params.id;

    if (!req.user.groupId.some(id => id == groupId)) { // Use == for potential type coercion if IDs might be String vs Number
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
});

// Create group
router.post("/", (req, res) => {
  res.send("Create group API");
});

// Get a specific group
router.get("/:groupId", (req, res) => {
  res.send("Get specific group API");
});

export default router;
