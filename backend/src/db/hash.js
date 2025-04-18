import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../models/userModel.js";

dotenv.config();

// MongoDB URI from .env
const MONGO_URI = process.env.MONGO_URI;

const hashAllTestUsers = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to DB:", MONGO_URI);

    const users = await User.find({
      email: { $regex: /^test\d+@gmail\.com$/ },
    });

    for (let user of users) {
      // 安全判断：确保 _id 是数字（你使用 Number 自定义的 _id）
      if (typeof user._id !== "number") {
        console.warn(`⚠️ Skipping user with invalid _id: ${user._id}`);
        continue;
      }

      // 如果密码未加密（没有以 $2b$ 开头）
      if (!user.password.startsWith("$2b$")) {
        const hashed = await bcrypt.hash(user.password, 10);
        user.password = hashed;
        await user.save();
        console.log(`✔ Password hashed for: ${user.email}`);
      } else {
        console.log(`⏭ Already hashed: ${user.email}`);
      }
    }

    console.log("🎉 All eligible test users updated.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

hashAllTestUsers();
