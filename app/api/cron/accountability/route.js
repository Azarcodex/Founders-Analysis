import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Task from "@/models/Task";
import Notification from "@/models/Notification";
import ActivityLog from "@/models/ActivityLog";
import { recalculateFounderStats } from "@/lib/stats";

export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const force = searchParams.get("force") === "true";

    // Set target date for the check
    let targetDate = new Date();
    if (dateStr) {
      targetDate = new Date(dateStr);
    }
    targetDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Format target date for logs
    const dateFormatted = targetDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // Check if we've already run the check for this date to avoid duplicate spamming
    if (!force) {
      const existingWarning = await Notification.findOne({
        category: "alert",
        title: { $regex: `Accountability Warning.*${dateFormatted}`, $options: "i" },
      });
      if (existingWarning) {
        return NextResponse.json({
          success: true,
          message: `Accountability check for ${dateFormatted} has already been executed. Use ?force=true to override.`,
        });
      }
    }

    const founders = await User.find({});
    const runSummary = [];

    for (const founder of founders) {
      // Find tasks assigned to this founder on the target date
      const tasks = await Task.find({
        createdBy: founder._id,
        assignedDate: {
          $gte: targetDate,
          $lt: nextDate,
        },
      });

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t) => t.status === "completed").length;
      const incompleteTasks = totalTasks - completedTasks;

      let warningIssued = false;
      let warningMsg = "";

      if (totalTasks === 0) {
        // Case 1: No tasks added
        warningMsg = `${founder.name} did not add any task on ${dateFormatted}.`;
        warningIssued = true;

        // Issue notification visible to all
        await Notification.create({
          title: `Accountability Warning (${dateFormatted})`,
          description: warningMsg,
          category: "alert",
          recipient: null, // global
          creator: null,
        });

        // Log to ActivityLog
        await ActivityLog.create({
          founder: founder._id,
          action: "missed_tasks_warning",
          details: warningMsg,
          type: "system",
        });

        // Deduct contribution points directly and reset streak
        founder.productivityStats.streak = 0;
        founder.productivityStats.contributionScore = Math.max(
          founder.productivityStats.contributionScore - 15,
          0
        );
        await founder.save();
      } else if (incompleteTasks > 0) {
        // Case 2: Incomplete tasks
        warningMsg = `${founder.name} has ${incompleteTasks} incomplete task(s) on ${dateFormatted}.`;
        warningIssued = true;

        // Issue notification visible to all
        await Notification.create({
          title: `Accountability Warning (${dateFormatted})`,
          description: warningMsg,
          category: "alert",
          recipient: null,
          creator: null,
        });

        // Log to ActivityLog
        await ActivityLog.create({
          founder: founder._id,
          action: "incomplete_tasks_warning",
          details: warningMsg,
          type: "system",
        });

        // Deduct contribution points directly and reset streak
        founder.productivityStats.streak = 0;
        founder.productivityStats.contributionScore = Math.max(
          founder.productivityStats.contributionScore - 10,
          0
        );
        await founder.save();
      }

      // Re-run standard recalculation to ensure overall completeness rates are updated
      await recalculateFounderStats(founder._id);

      runSummary.push({
        founder: founder.name,
        totalTasks,
        completedTasks,
        warningIssued,
        warningMsg,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Accountability check completed for ${dateFormatted}`,
      summary: runSummary,
    });
  } catch (error) {
    console.error("Accountability check error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during accountability check: " + error.message },
      { status: 500 }
    );
  }
}
