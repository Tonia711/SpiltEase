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
    default: new mongoose.Types.ObjectId("000000000000000000000001"),
  },
  groupId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
  ],  
});

const User = mongoose.model("User", userSchema);

export default User;
