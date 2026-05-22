import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import FutureAnalysis from "@/models/FutureAnalysis";
import { getCoreSessionUser } from "@/lib/coreAuth";

export async function GET(request, { params }) {
  try {
    const session = await getCoreSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const comments = await Comment.find({ analysisId: id })
      .populate("founder", "name email avatar status")
      .populate("coreMember", "name email avatar status")
      .sort({ createdAt: 1 });

    return NextResponse.json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error("Fetch core comments error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while fetching comments" },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getCoreSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const note = await FutureAnalysis.findById(id);
    if (!note) {
      return NextResponse.json({ error: "Strategic note not found" }, { status: 404 });
    }

    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    }

    const comment = await Comment.create({
      content: content.trim(),
      analysisId: id,
      coreMember: session.id,
      userType: "CoreMember",
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      "coreMember",
      "name email avatar status"
    );

    return NextResponse.json({
      success: true,
      comment: populatedComment,
    });
  } catch (error) {
    console.error("Create core comment error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while adding comment" },
      { status: 500 }
    );
  }
}
