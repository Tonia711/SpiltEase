import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatarId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Avatar",
    required: true,
    default: 1, // 默认使用头像1
  },
  groupId: {
    type: [Number], // 或者 mongoose.Schema.Types.ObjectId 如果是引用 Group collection
    default: [],
  },
});

const User = mongoose.model("User", userSchema);

export default User;
