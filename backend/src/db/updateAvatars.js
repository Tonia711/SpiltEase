import mongoose from "mongoose";
import "dotenv/config";
import Avatar from "../models/avatarModel.js";

await mongoose.connect(process.env.MONGO_URI); // 替换成你的连接地址

const result = await Avatar.updateMany(
  { isSystem: { $exists: false } }, // 只更新旧数据
  { $set: { isSystem: true } } // 设置为系统头像
);

console.log(`Updated ${result.modifiedCount} avatars.`);

await mongoose.disconnect();
