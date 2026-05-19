import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import FutureAnalysis from "@/models/FutureAnalysis";
import ActivityLog from "@/models/ActivityLog";
import Comment from "@/models/Comment";
import { getSessionUser } from "@/lib/auth";
import { recalculateFounderStats } from "@/lib/stats";

export async function PUT(request, { params }) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const note = await FutureAnalysis.findById(id);
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, tags, priority, status, pinned } = body;

    const oldStatus = note.status;

    if (title !== undefined) note.title = title;
    if (description !== undefined) note.description = description;
    if (tags !== undefined) note.tags = tags;
    if (priority !== undefined) note.priority = priority;
    if (pinned !== undefined) note.pinned = pinned;

    if (status !== undefined && status !== oldStatus) {
      note.status = status;
      // Log status change
      await ActivityLog.create({
        founder: session.id,
        action: "updated_status",
        details: `Changed note status to ${status}: "${note.title}"`,
        type: "note",
      });
    }

    await note.save();

    // Recalculate stats for the note creator
    await recalculateFounderStats(note.founder.toString());

    return NextResponse.json({
      success: true,
      note,
    });
  } catch (error) {
    console.error("Update strategic note error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while updating strategic note" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const note = await FutureAnalysis.findById(id);
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Only creator can delete note
    if (note.founder.toString() !== session.id) {
      return NextResponse.json({ error: "Forbidden to delete this note" }, { status: 403 });
    }

    const noteFounderId = note.founder.toString();
    const title = note.title;

    await FutureAnalysis.findByIdAndDelete(id);
    // Remove all associated comments as well
    await Comment.deleteMany({ analysisId: id });

    // Log activity
    await ActivityLog.create({
      founder: session.id,
      action: "deleted_note",
      details: `Deleted strategic note: "${title}"`,
      type: "note",
    });

    // Recalculate stats for founder
    await recalculateFounderStats(noteFounderId);

    return NextResponse.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Delete strategic note error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while deleting strategic note" },
      { status: 500 }
    );
  }
}
