import User from "../models/userModel.js";

// 获取当前登录用户信息
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // 忽略密码
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch user info", detail: err.message });
  }
};

// 更新当前用户信息
export const updateMe = async (req, res) => {
  const updates = req.body;
  delete updates.password; // 确保不能更新密码

  try {
    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true, // 返回更新后的用户
      runValidators: true, // 确保字段验证
    }).select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user); // 返回更新后的用户数据
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update profile", detail: err.message });
  }
};

// 删除当前用户
export const deleteMe = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // 你可以在这里添加清理其他数据的逻辑，比如删除用户相关的群组、账单等

    res.json({ message: "User deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to delete user", detail: err.message });
  }
};
