import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    analysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FutureAnalysis",
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
    userType: {
      type: String,
      enum: ["Founder", "CoreMember"],
      required: true,
      default: "Founder",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Comment || mongoose.model("Comment", CommentSchema);
