import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    founder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true, // e.g. "added_task", "completed_task", "created_note", "updated_status", "added_comment"
    },
    details: {
      type: String,
      default: "", // e.g. "Completed: Deploy beta release"
    },
    type: {
      type: String,
      enum: ["task", "note", "comment", "milestone", "system"],
      default: "system",
    },
  },
  { timestamps: true }
);

export default mongoose.models.ActivityLog || mongoose.model("ActivityLog", ActivityLogSchema);
