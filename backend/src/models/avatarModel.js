import mongoose from "mongoose";

const avatarSchema = new mongoose.Schema({
  avatarUrl: {
    type: String,
    required: true,
    trim: true,
  },
  isSystem: {
    type: Boolean,
    default: false, // 用户上传为 false，系统内置为 true
  },
});

const Avatar = mongoose.model("Avatar", avatarSchema);

export default Avatar;
