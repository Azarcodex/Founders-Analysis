import User from "@/models/User";
import Task from "@/models/Task";
import FutureAnalysis from "@/models/FutureAnalysis";
import { connectToDatabase } from "@/lib/mongodb";

export async function recalculateFounderStats(userId) {
  await connectToDatabase();

  // 1. Get all tasks for this user
  const tasks = await Task.find({ createdBy: userId });
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 2. Calculate streak: consecutive days with at least one completed task
  // Let's get completion dates sorted descending
  const completionDates = tasks
    .filter((t) => t.status === "completed" && t.completedAt)
    .map((t) => {
      const d = new Date(t.completedAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });

  // Remove duplicates and sort descending
  const uniqueDates = [...new Set(completionDates)].sort((a, b) => b - a);

  let streak = 0;
  if (uniqueDates.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const latestDate = uniqueDates[0];
    
    // Streak continues if they completed something today or yesterday
    if (latestDate === today.getTime() || latestDate === yesterday.getTime()) {
      streak = 1;
      let currentDate = latestDate;
      
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevExpected = new Date(currentDate);
        prevExpected.setDate(prevExpected.getDate() - 1);
        
        if (uniqueDates[i] === prevExpected.getTime()) {
          streak++;
          currentDate = uniqueDates[i];
        } else {
          break;
        }
      }
    }
  }

  // 3. Strategic Participation Points (30 points max): based on FutureAnalysis notes
  const notesCount = await FutureAnalysis.countDocuments({ founder: userId });
  const participationPoints = Math.min(notesCount * 10, 30);

  // 4. Streak points (20 points max): 4 points per streak day
  const streakPoints = Math.min(streak * 4, 20);

  // 5. Completion points (50 points max): completion rate / 2
  const completionPoints = Math.round(completionRate / 2);

  // 6. Compute final contribution score (max 100)
  const contributionScore = Math.min(completionPoints + streakPoints + participationPoints, 100);

  // Update the user
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      "productivityStats.totalTasks": totalTasks,
      "productivityStats.completedTasks": completedTasks,
      "productivityStats.completionRate": completionRate,
      "productivityStats.streak": streak,
      "productivityStats.contributionScore": contributionScore,
    },
    { new: true }
  );

  return updatedUser;
}

export async function recalculateAllFoundersStats() {
  await connectToDatabase();
  const founders = await User.find({});
  for (const founder of founders) {
    await recalculateFounderStats(founder._id);
  }
}
