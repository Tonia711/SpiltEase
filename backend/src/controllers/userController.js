// File: src/controllers/userController.js
import User from "../models/userModel.js";

// 获取当前登录用户信息，包含 avatarUrl
export const getMe = async (req, res) => {
  console.log("👤 [getMe] req.user:", req.user);
  console.log(
    "🔎 [getMe] req.user.id 类型和值:",
    typeof req.user.id,
    req.user.id
  );
  try {
    // 查询并关联 avatar
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate({ path: "avatarId", select: "avatarUrl" });

    if (!user) return res.status(404).json({ error: "User not found" });

    const userObj = user.toObject();
    // 将 avatarId 对象展开并添加 avatarUrl 字段
    userObj.avatarUrl = userObj.avatarId?.avatarUrl;
    userObj.avatarId = userObj.avatarId?._id;

    res.json(userObj);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch user info", detail: err.message });
  }
};

// 更新当前用户信息，可更新 userName 或 avatarId
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

// 删除当前用户
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
