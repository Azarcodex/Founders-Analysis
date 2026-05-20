import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Idea from "@/models/Idea";
import IdeaLike from "@/models/IdeaLike";
import { getCoreSessionUser } from "@/lib/coreAuth";

export async function GET(request) {
  try {
    const session = await getCoreSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const createdByMe = searchParams.get("createdByMe") === "true";
    const search = searchParams.get("search") || "";

    const query = {
      createdBy: session.id,
    };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Fetch ideas
    const ideas = await Idea.find(query)
      .populate("createdBy", "name email avatar status")
      .sort({ pinned: -1, createdAt: -1 })
      .lean();

    // Fetch likes details for each idea
    const processedIdeas = await Promise.all(
      ideas.map(async (idea) => {
        const likesCount = await IdeaLike.countDocuments({ idea: idea._id });
        const userLiked = await IdeaLike.exists({ idea: idea._id, coreMember: session.id });
        return {
          ...idea,
          likesCount,
          userLiked: !!userLiked,
        };
      })
    );

    return NextResponse.json({
      success: true,
      ideas: processedIdeas,
    });
  } catch (error) {
    console.error("Fetch ideas error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while fetching ideas" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getCoreSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
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

    const idea = await Idea.create({
      title,
      description,
      category,
      tags: processedTags,
      createdBy: session.id,
      priority: priority || "medium",
      status: "Pending Review",
    });

    return NextResponse.json({
      success: true,
      idea,
    });
  } catch (error) {
    console.error("Create idea error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while creating idea: " + error.message },
      { status: 500 }
    );
  }
}
