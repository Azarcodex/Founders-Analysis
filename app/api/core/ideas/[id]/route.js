import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Idea from "@/models/Idea";
import IdeaLike from "@/models/IdeaLike";
import IdeaComment from "@/models/IdeaComment";
import IdeaNotification from "@/models/IdeaNotification";
import { getCoreSessionUser } from "@/lib/coreAuth";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const session = await getCoreSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const idea = await Idea.findById(id)
      .populate("createdBy", "name email avatar status")
      .lean();

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // Verify ownership
    const creatorId = idea.createdBy?._id?.toString() || idea.createdBy?.toString();
    if (creatorId !== session.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only view your own ideas" },
        { status: 403 }
      );
    }

    const likesCount = await IdeaLike.countDocuments({ idea: id });
    const userLiked = await IdeaLike.exists({ idea: id, coreMember: session.id });

    return NextResponse.json({
      success: true,
      idea: {
        ...idea,
        likesCount,
        userLiked: !!userLiked,
      },
    });
  } catch (error) {
    console.error("Fetch single idea error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while fetching idea details" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const session = await getCoreSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const idea = await Idea.findById(id);

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // Verify ownership
    if (idea.createdBy.toString() !== session.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only edit your own ideas" },
        { status: 403 }
      );
    }

    const { title, description, category, tags, priority } = await request.json();

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: "Title, description and category are required" },
        { status: 400 }
      );
    }

    const processedTags = tags
      ? (Array.isArray(tags) ? tags : tags.split(",").map((t) => t.trim()).filter(Boolean))
      : [];

    idea.title = title;
    idea.description = description;
    idea.category = category;
    idea.tags = processedTags;
    if (priority) idea.priority = priority;

    await idea.save();

    return NextResponse.json({
      success: true,
      idea,
    });
  } catch (error) {
    console.error("Update idea error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during idea update: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const session = await getCoreSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const idea = await Idea.findById(id);

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // Verify ownership
    if (idea.createdBy.toString() !== session.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own ideas" },
        { status: 403 }
      );
    }

    // Delete associated comments, likes, and notifications
    await IdeaComment.deleteMany({ idea: id });
    await IdeaLike.deleteMany({ idea: id });
    await IdeaNotification.deleteMany({ idea: id });
    await Idea.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Idea deleted successfully",
    });
  } catch (error) {
    console.error("Delete idea error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during idea deletion: " + error.message },
      { status: 500 }
    );
  }
}
