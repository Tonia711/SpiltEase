import Avatar from "../models/avatarModel.js";
import User from "../models/userModel.js";

export const getAllAvatars = async (req, res) => {
  try {
    const avatars = await Avatar.find();
    res.json(avatars);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch avatars" });
  }
};

// 上传自定义头像并更新用户 avatarId
export const uploadCustomAvatar = async (req, res) => {
  try {
    const { userId } = req.body; // 或从 req.user 拿
    const filePath = `uploads/${req.file.filename}`;

    // Step 1: 存入 Avatar 表
    const newAvatar = await Avatar.create({
      avatarUrl: filePath,
      isSystem: false,
    });

    // Step 2: 更新用户 avatarId 为这个头像
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
