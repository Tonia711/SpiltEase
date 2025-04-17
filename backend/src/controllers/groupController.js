import Group from "../models/groupModel.js";

export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("User ID:", userId); // 打印 userId 检查

    // 查询 group.members 数组中包含 userId 的 group
    const groups = await Group.find({ "members.memberId": userId });
    console.log("Groups fetched:", groups); // 打印查询结果

    res.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error); // 输出错误详情
    res
      .status(500)
      .json({ error: "Failed to fetch groups", detail: error.message });
  }
};
