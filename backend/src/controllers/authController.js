// File: src/controllers/authController.js

import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// 生成 JWT
const createToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, userName: user.userName },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// 注册
export const registerUser = async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      userName,
      email,
      password: hashedPassword,
      avatarId: 1,
    });

    const token = createToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: "Registration failed", detail: err.message });
  }
};

// 登录
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = createToken(user);

  res.json({ token, user });
};
