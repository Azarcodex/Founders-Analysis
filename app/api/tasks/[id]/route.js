import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import ActivityLog from "@/models/ActivityLog";
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

    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Only allow task owner to edit their tasks
    if (task.createdBy.toString() !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, priority, status } = body;

    const oldStatus = task.status;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;

    if (status !== undefined && status !== oldStatus) {
      task.status = status;
      if (status === "completed") {
        task.completedAt = new Date();
        
        // Log activity
        await ActivityLog.create({
          founder: session.id,
          action: "completed_task",
          details: `Completed task: "${task.title}"`,
          type: "task",
        });
      } else {
        task.completedAt = null;
        
        // Log activity
        await ActivityLog.create({
          founder: session.id,
          action: "reopened_task",
          details: `Reopened task: "${task.title}"`,
          type: "task",
        });
      }
    }

    await task.save();

    // Recalculate stats
    await recalculateFounderStats(session.id);

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while updating task" },
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

    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Only allow task owner to delete their tasks
    if (task.createdBy.toString() !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await Task.findByIdAndDelete(id);

    // Log activity
    await ActivityLog.create({
      founder: session.id,
      action: "deleted_task",
      details: `Deleted task: "${task.title}"`,
      type: "task",
    });

    // Recalculate stats
    await recalculateFounderStats(session.id);

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while deleting task" },
      { status: 500 }
    );
  }
}
