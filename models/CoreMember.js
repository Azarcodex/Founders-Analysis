import mongoose from "mongoose";

const CoreMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "Active", // e.g. "Active", "Away", "Offline"
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.models.CoreMember || mongoose.model("CoreMember", CoreMemberSchema);
