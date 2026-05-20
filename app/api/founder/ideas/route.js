import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Idea from "@/models/Idea";
import IdeaLike from "@/models/IdeaLike";
import { getSessionUser } from "@/lib/auth";

export async function GET(request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const search = searchParams.get("search") || "";

    const query = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const ideas = await Idea.find(query)
      .populate("createdBy", "name email avatar status")
      .sort({ pinned: -1, createdAt: -1 })
      .lean();

    const enrichedIdeas = await Promise.all(
      ideas.map(async (idea) => {
        const likesCount = await IdeaLike.countDocuments({ idea: idea._id });
        return {
          ...idea,
          likesCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      ideas: enrichedIdeas,
    });
  } catch (error) {
    console.error("Founder fetch ideas error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while fetching ideas" },
      { status: 500 }
    );
  }
}
