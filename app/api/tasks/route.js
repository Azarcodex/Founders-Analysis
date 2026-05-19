import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import User from "@/models/User";
import ActivityLog from "@/models/ActivityLog";
import { getSessionUser } from "@/lib/auth";
import { recalculateFounderStats } from "@/lib/stats";

export async function GET(request) {
  try {
    await connectToDatabase();
    
    // Get date parameter
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    
    let targetDate = new Date();
    if (dateStr) {
      targetDate = new Date(dateStr);
    }
    targetDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Fetch tasks for the target date
    const tasks = await Task.find({
      assignedDate: {
        $gte: targetDate,
        $lt: nextDate,
      },
    })
      .populate("createdBy", "name email avatar status productivityStats")
      .sort({ createdAt: -1 });

    // Fetch all founders to compile daily accountability stats
    const founders = await User.find({}).select("-password");

    const founderSummaries = founders.map((founder) => {
      const founderTasks = tasks.filter(
        (t) => t.createdBy._id.toString() === founder._id.toString()
      );
      const total = founderTasks.length;
      const completed = founderTasks.filter((t) => t.status === "completed").length;
      const pending = total - completed;

      // Status logic:
      // Red = No tasks added today
      // Yellow = Has tasks, but some are pending
      // Green = Has tasks, and all are completed
      let statusColor = "red";
      if (total > 0) {
        statusColor = pending === 0 ? "green" : "yellow";
      }

      return {
        founder: {
          id: founder._id,
          name: founder.name,
          email: founder.email,
          avatar: founder.avatar,
          status: founder.status,
          contributionScore: founder.productivityStats.contributionScore,
          lastActive: founder.lastActive,
        },
        stats: {
          total,
          completed,
          pending,
          statusColor,
        },
        tasks: founderTasks,
      };
    });

    return NextResponse.json({
      success: true,
      tasks,
      founderSummaries,
    });
  } catch (error) {
    console.error("Fetch tasks error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while fetching tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { title, description, priority, assignedDate } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    let taskDate = new Date();
    if (assignedDate) {
      taskDate = new Date(assignedDate);
    }
    taskDate.setHours(0, 0, 0, 0);

    const task = await Task.create({
      title,
      description,
      priority: priority || "medium",
      status: "pending",
      createdBy: session.id,
      assignedDate: taskDate,
    });

    // Create activity log
    await ActivityLog.create({
      founder: session.id,
      action: "added_task",
      details: `Added task: "${title}"`,
      type: "task",
    });

    // Recalculate stats
    await recalculateFounderStats(session.id);

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while creating task" },
      { status: 500 }
    );
  }
}
