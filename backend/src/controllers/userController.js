import mongoose from "mongoose";
import User from "../models/userModel.js";
import Group from "../models/groupModel.js";

// Get current logged-in user info
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate({ path: "avatarId", select: "avatarUrl" });

    if (!user) return res.status(404).json({ error: "User not found" });

    const userObj = user.toObject();
    // Flatten avatarId to avatarUrl + raw ID
    userObj.avatarUrl = userObj.avatarId?.avatarUrl;
    userObj.avatarId = userObj.avatarId?._id;

    res.json(userObj);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch user info", detail: err.message });
  }
};

// Update user profile (username or avatar)
export const updateMe = async (req, res) => {
  const updates = {};
  if (req.body.userName) updates.userName = req.body.userName;
  if (req.body.avatarId) updates.avatarId = req.body.avatarId;

  try {
    const user = await User.findOneAndUpdate({ _id: req.user.id }, updates, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .populate({ path: "avatarId", select: "avatarUrl" });

    if (!user) return res.status(404).json({ error: "User not found" });

    // Propagate updated userName to all group member lists
    if (updates.userName) {
      const userIdObj = new mongoose.Types.ObjectId(req.user.id);
      await Group.updateMany(
        { "members.userId": userIdObj },
        { $set: { "members.$[elem].userName": updates.userName } },
        {
          arrayFilters: [{ "elem.userId": userIdObj }],
        }
      );
    }

    const userObj = user.toObject();
    userObj.avatarUrl = userObj.avatarId?.avatarUrl;
    userObj.avatarId = userObj.avatarId?._id;

    res.json(userObj);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update profile", detail: err.message });
  }
};

// Delete current user account
export const deleteMe = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.user.id });

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to delete user", detail: err.message });
  }
};

// Search users by username keyword (case-insensitive)
export const searchUsers = async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === "") {
    return res.status(400).json({ error: "Missing search query" });
  }

  try {
    const users = await User.find({
      userName: { $regex: q, $options: "i" },
    }).select("_id userName email");

    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Check if email or username already exists
export const checkFieldExists = async (req, res) => {
  const { field, value } = req.query;

  if (!["email", "userName"].includes(field)) {
    return res.status(400).json({ error: "Invalid field" });
  }

  try {
    const exists = await User.exists({ [field]: value });
    res.json({ exists: !!exists });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to check field", detail: err.message });
  }
};
