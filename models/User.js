import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
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
      default: "Active", // e.g. "Active", "Working", "Offline", "Away"
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    productivityStats: {
      completionRate: {
        type: Number,
        default: 0,
      },
      totalTasks: {
        type: Number,
        default: 0,
      },
      completedTasks: {
        type: Number,
        default: 0,
      },
      streak: {
        type: Number,
        default: 0,
      },
      contributionScore: {
        type: Number,
        default: 100,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
