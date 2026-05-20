import mongoose from "mongoose";

const IdeaLikeSchema = new mongoose.Schema(
  {
    idea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Idea",
      required: true,
    },
    coreMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CoreMember",
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure a core member can only like a given idea once
IdeaLikeSchema.index({ idea: 1, coreMember: 1 }, { unique: true });

export default mongoose.models.IdeaLike || mongoose.model("IdeaLike", IdeaLikeSchema);
