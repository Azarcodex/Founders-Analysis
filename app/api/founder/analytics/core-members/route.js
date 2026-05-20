import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CoreMember from "@/models/CoreMember";
import Idea from "@/models/Idea";
import IdeaLike from "@/models/IdeaLike";
import IdeaComment from "@/models/IdeaComment";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const members = await CoreMember.find({}).lean();
    const ideas = await Idea.find({}).lean();
    const likes = await IdeaLike.find({}).lean();
    const comments = await IdeaComment.find({}).lean();

    // 1. Calculate stats per member
    const memberStats = await Promise.all(
      members.map(async (member) => {
        const memberIdeas = ideas.filter(
          (idea) => idea.createdBy.toString() === member._id.toString()
        );
        const totalIdeas = memberIdeas.length;
        const approvedIdeas = memberIdeas.filter((idea) => idea.status === "Approved").length;

        const ideaIds = memberIdeas.map((i) => i._id.toString());
        const likesReceived = likes.filter((l) => ideaIds.includes(l.idea.toString())).length;
        const commentsReceived = comments.filter((c) => ideaIds.includes(c.idea.toString())).length;

        // Contribution formula: 10 pts per Idea, 25 pts per Approved Idea, 5 pts per Like received, 5 pts per Comment received
        const contributionScore =
          totalIdeas * 10 + approvedIdeas * 25 + likesReceived * 5 + commentsReceived * 5;

        // Engagement Score
        const engagementScore = likesReceived * 2 + commentsReceived * 3;

        return {
          id: member._id,
          name: member.name,
          email: member.email,
          avatar: member.avatar,
          status: member.status,
          totalIdeas,
          approvedIdeas,
          likesReceived,
          commentsReceived,
          contributionScore,
          engagementScore,
        };
      })
    );

    // Sort rankings by contribution score descending
    const rankings = [...memberStats].sort((a, b) => b.contributionScore - a.contributionScore);

    // Most active member (by total ideas)
    const mostActive = [...memberStats].sort((a, b) => b.totalIdeas - a.totalIdeas)[0] || null;

    // Highest approved ideas member
    const highestApproved =
      [...memberStats].sort((a, b) => b.approvedIdeas - a.approvedIdeas)[0] || null;

    // 2. Weekly Activity Chart (last 7 days)
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyActivity = [];
    
    // Generate last 7 days array
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = daysOfWeek[d.getDay()];
      
      // Start of day
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      // End of day
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const count = ideas.filter((idea) => {
        const createdAt = new Date(idea.createdAt);
        return createdAt >= startOfDay && createdAt <= endOfDay;
      }).length;

      weeklyActivity.push({
        name: dayName,
        ideas: count,
      });
    }

    return NextResponse.json({
      success: true,
      analytics: {
        mostActive,
        highestApproved,
        rankings,
        weeklyActivity,
        totals: {
          totalIdeas: ideas.length,
          totalLikes: likes.length,
          totalComments: comments.length,
          pendingReviews: ideas.filter((i) => i.status === "Pending Review").length,
          approvedIdeas: ideas.filter((i) => i.status === "Approved").length,
        },
      },
    });
  } catch (error) {
    console.error("Founder fetch core analytics error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while computing analytics: " + error.message },
      { status: 500 }
    );
  }
}
