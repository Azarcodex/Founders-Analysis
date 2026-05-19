import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Task from "@/models/Task";
import FutureAnalysis from "@/models/FutureAnalysis";
import { recalculateAllFoundersStats } from "@/lib/stats";

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Recalculate stats first to ensure we display accurate, fresh data
    await recalculateAllFoundersStats();

    // 2. Fetch founders for leaderboard
    const founders = await User.find({}).sort({
      "productivityStats.contributionScore": -1,
      "productivityStats.completionRate": -1,
    }).select("-password");

    // 3. Compile completion ratios and stats
    const totalCompanyTasks = await Task.countDocuments();
    const totalCompanyCompleted = await Task.countDocuments({ status: "completed" });
    const overallCompletionRate = totalCompanyTasks > 0 ? Math.round((totalCompanyCompleted / totalCompanyTasks) * 100) : 0;

    // 4. Generate last 7 days daily productivity data for Recharts
    const dailyData = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() - i);
      
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayName = targetDate.toLocaleDateString("en-US", { weekday: "short" });

      // Fetch completed tasks for this day
      const completedTasks = await Task.find({
        status: "completed",
        assignedDate: {
          $gte: targetDate,
          $lt: nextDate,
        },
      });

      // Construct Recharts day data object
      const dayObj = { name: dayName };
      founders.forEach((f) => {
        const count = completedTasks.filter(
          (t) => t.createdBy.toString() === f._id.toString()
        ).length;
        dayObj[f.name] = count;
      });

      dailyData.push(dayObj);
    }

    // 5. Generate consistency / comparison stats
    const consistencyStats = founders.map((f) => {
      const stats = f.productivityStats;
      const total = stats.totalTasks || 0;
      const completed = stats.completedTasks || 0;
      
      return {
        founder: f.name,
        total,
        completed,
        rate: stats.completionRate || 0,
        streak: stats.streak || 0,
        contributionScore: stats.contributionScore || 0,
      };
    });

    // 6. Strategic note contributions
    const notesStats = [];
    for (const f of founders) {
      const notesCount = await FutureAnalysis.countDocuments({ founder: f._id });
      notesStats.push({
        founder: f.name,
        notesCount,
      });
    }

    return NextResponse.json({
      success: true,
      leaderboard: founders,
      dailyProductivity: dailyData,
      consistencyStats,
      notesStats,
      companyOverview: {
        totalTasks: totalCompanyTasks,
        completedTasks: totalCompanyCompleted,
        completionRate: overallCompletionRate,
      },
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while compiling analytics" },
      { status: 500 }
    );
  }
}
