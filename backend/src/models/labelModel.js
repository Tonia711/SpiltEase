import mongoose from "mongoose";

const labelSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true,
  },
  iconUrl: {
    type: String,
    required: true,
    unique: true,
  },
});

const Label = mongoose.model("Label", labelSchema);

export default Label;
