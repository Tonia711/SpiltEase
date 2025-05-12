import mongoose from "mongoose";

// Schema for user avatar (system or uploaded)
const avatarSchema = new mongoose.Schema({
  avatarUrl: {
    type: String,
    required: true, // URL or relative path to image file
    trim: true,
  },
  isSystem: {
    type: Boolean,
    default: false, // true = preset avatar, false = user-uploaded
  },
});

const Avatar = mongoose.model("Avatar", avatarSchema);

export default Avatar;
