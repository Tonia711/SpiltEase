import Avatar from "../models/avatarModel.js";
import User from "../models/userModel.js";

// Get all system avatars (preset)
export const getAllAvatars = async (req, res) => {
  try {
    const avatars = await Avatar.find({ isSystem: true });
    res.json(avatars);
  } catch (err) {
    res.status(500).json({ error: "Failed to get avatars" });
  }
};

// Handle custom avatar upload
export const uploadCustomAvatar = async (req, res) => {
  try {
    const { userId } = req.body;
    const filePath = `uploads/${req.file.filename}`;

    // Save uploaded avatar as a non-system avatar
    const newAvatar = await Avatar.create({
      avatarUrl: filePath,
      isSystem: false,
    });

    // Link new avatar to user
    await User.findByIdAndUpdate(userId, {
      avatarId: newAvatar._id,
    });

    res.status(201).json({
      message: "Avatar uploaded",
      avatarId: newAvatar._id,
      avatarUrl: filePath,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
};
