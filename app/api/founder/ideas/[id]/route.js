import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Idea from "@/models/Idea";
import IdeaComment from "@/models/IdeaComment";
import IdeaLike from "@/models/IdeaLike";
import IdeaNotification from "@/models/IdeaNotification";
import { getSessionUser } from "@/lib/auth";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const idea = await Idea.findById(id);

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    const { status, founderResponse, pinned } = await request.json();

    let statusChanged = false;
    let oldStatus = idea.status;
    if (status && status !== idea.status) {
      idea.status = status;
      statusChanged = true;
    }

    let responseAdded = false;
    if (founderResponse !== undefined && founderResponse !== idea.founderResponse) {
      idea.founderResponse = founderResponse;
      responseAdded = true;
    }

    if (pinned !== undefined) {
      idea.pinned = pinned;
    }

    await idea.save();

    // Create notifications for the Core Member who created the idea
    if (statusChanged) {
      await IdeaNotification.create({
        recipient: idea.createdBy,
        idea: idea._id,
        title: `Idea status updated to ${status}`,
        description: `Your idea "${idea.title}" was updated from "${oldStatus}" to "${status}" by ${session.name}`,
        type: "status_change",
      });
    }

    if (responseAdded && founderResponse.trim() !== "") {
      await IdeaNotification.create({
        recipient: idea.createdBy,
        idea: idea._id,
        title: "Founder responded to your Idea",
        description: `${session.name} responded to "${idea.title}"`,
        type: "response",
      });
    }

    return NextResponse.json({
      success: true,
      idea,
    });
  } catch (error) {
    console.error("Founder update idea error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during idea status/response update" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const idea = await Idea.findById(id);

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // Clean up associated resources
    await IdeaComment.deleteMany({ idea: id });
    await IdeaLike.deleteMany({ idea: id });
    await IdeaNotification.deleteMany({ idea: id });
    await Idea.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Idea deleted successfully by Founder",
    });
  } catch (error) {
    console.error("Founder delete idea error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during idea deletion by Founder" },
      { status: 500 }
    );
  }
}
