import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Generate JWT token with basic user info
const createToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, userName: user.userName },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// Handle user registration
export const registerUser = async (req, res) => {
  try {
    const { userName, email, password, avatarId } = req.body;

    // Check for existing email
    const emailExists = await User.findOne({ email });
    if (emailExists)
      return res
        .status(409)
        .json({ field: "email", error: "Email already exists" });

    // Check for existing username
    const userNameExists = await User.findOne({ userName });
    if (userNameExists)
      return res
        .status(409)
        .json({ field: "userName", error: "Username already taken" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use default avatar ID if none provided
    const resolvedAvatarId = avatarId
      ? avatarId
      : new mongoose.Types.ObjectId("000000000000000000000001");

    // Create new user
    const user = await User.create({
      userName,
      email,
      password: hashedPassword,
      avatarId: resolvedAvatarId,
    });

    const token = createToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed", detail: err.message });
  }
};

// Handle user login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt:", email, password);

  const user = await User.findOne({ email });

  // Validate user and password
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = createToken(user);

  res.json({ token, user });
};
