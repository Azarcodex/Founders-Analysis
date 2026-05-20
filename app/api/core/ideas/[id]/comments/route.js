import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import IdeaComment from "@/models/IdeaComment";
import Idea from "@/models/Idea";
import IdeaNotification from "@/models/IdeaNotification";
import { getCoreSessionUser } from "@/lib/coreAuth";
import { getSessionUser } from "@/lib/auth"; // Founders can comment too!

// Fetch all comments for an idea
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const comments = await IdeaComment.find({ idea: id })
      .populate("founder", "name avatar")
      .populate("coreMember", "name avatar")
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error("Fetch comments error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while fetching comments" },
      { status: 500 }
    );
  }
}

// Add a comment/reply
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    
    // Check if session is Core Member or Founder
    let session = await getCoreSessionUser();
    let userType = "CoreMember";

    if (!session) {
      // Check if Founder session exists
      session = await getSessionUser();
      userType = "Founder";
    }

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const idea = await Idea.findById(id);
    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    const { text, parentComment } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
    }

    const commentData = {
      idea: id,
      userType,
      text: text.trim(),
      parentComment: parentComment || null,
    };

    if (userType === "Founder") {
      commentData.founder = session.id;
    } else {
      commentData.coreMember = session.id;
    }

    const comment = await IdeaComment.create(commentData);

    // Populate the newly created comment before returning
    const populatedComment = await IdeaComment.findById(comment._id)
      .populate("founder", "name avatar")
      .populate("coreMember", "name avatar");

    // Notifications logic
    if (userType === "Founder") {
      // Notify Core Member that Founder commented on their idea
      await IdeaNotification.create({
        recipient: idea.createdBy,
        idea: id,
        title: "Founder Commented on your Idea",
        description: `${session.name} commented: "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}"`,
        type: "comment",
      });
    } else {
      // Notify Idea creator (if comment is by someone else)
      if (idea.createdBy.toString() !== session.id) {
        await IdeaNotification.create({
          recipient: idea.createdBy,
          idea: id,
          title: "New Comment on your Idea",
          description: `${session.name} commented: "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}"`,
          type: "comment",
        });
      }

      // If it is a reply, notify the parent comment owner
      if (parentComment) {
        const parent = await IdeaComment.findById(parentComment);
        if (parent && parent.userType === "CoreMember" && parent.coreMember.toString() !== session.id) {
          await IdeaNotification.create({
            recipient: parent.coreMember,
            idea: id,
            title: "New Reply to your Comment",
            description: `${session.name} replied: "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}"`,
            type: "comment",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      comment: populatedComment,
    });
  } catch (error) {
    console.error("Post comment error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while posting comment" },
      { status: 500 }
    );
  }
}
