import mongoose from "mongoose";

const IdeaSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "feature ideas",
        "UI improvements",
        "business ideas",
        "scaling ideas",
        "marketing ideas",
        "bug reports",
        "automation ideas",
        "AI ideas",
        "workflow improvements",
      ],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CoreMember",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending Review", "Under Discussion", "Approved", "Rejected", "Planned"],
      default: "Pending Review",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    founderResponse: {
      type: String,
      default: "",
    },
    pinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Idea || mongoose.model("Idea", IdeaSchema);
