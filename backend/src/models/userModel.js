import mongoose from "mongoose";

// Schema for application users
const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true, // must be globally unique
  },
  email: {
    type: String,
    required: true,
    unique: true, // used for login / identity
  },
  password: {
    type: String,
    required: true, // hashed password
  },
  avatarId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Avatar", // reference to avatar document
    required: true,
    default: new mongoose.Types.ObjectId("000000000000000000000001"), // fallback avatar
  },
  groupId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group", // user can belong to multiple groups
    },
  ],
});

const User = mongoose.model("User", userSchema);

export default User;
