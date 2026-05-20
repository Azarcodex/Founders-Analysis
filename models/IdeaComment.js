import mongoose from "mongoose";

const IdeaCommentSchema = new mongoose.Schema(
  {
    idea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Idea",
      required: true,
    },
    userType: {
      type: String,
      enum: ["Founder", "CoreMember"],
      required: true,
    },
    founder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    coreMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CoreMember",
      default: null,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IdeaComment",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.IdeaComment || mongoose.model("IdeaComment", IdeaCommentSchema);
