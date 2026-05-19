import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import FutureAnalysis from "@/models/FutureAnalysis";
import ActivityLog from "@/models/ActivityLog";
import { getSessionUser } from "@/lib/auth";
import { recalculateFounderStats } from "@/lib/stats";

export async function GET(request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const pinned = searchParams.get("pinned");

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (pinned !== null && pinned !== undefined) {
      query.pinned = pinned === "true";
    }

    const notes = await FutureAnalysis.find(query)
      .populate("founder", "name email avatar status")
      .sort({ pinned: -1, updatedAt: -1 });

    return NextResponse.json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error("Fetch future analysis error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while fetching strategic notes" },
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
    const { title, description, tags, priority, status } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const note = await FutureAnalysis.create({
      title,
      description: description || "",
      founder: session.id,
      tags: tags || [],
      priority: priority || "Medium",
      status: status || "Under Discussion",
      pinned: false,
    });

    // Log activity
    await ActivityLog.create({
      founder: session.id,
      action: "created_note",
      details: `Created strategic note: "${title}"`,
      type: "note",
    });

    // Recalculate stats since participation counts notes
    await recalculateFounderStats(session.id);

    return NextResponse.json({
      success: true,
      note,
    });
  } catch (error) {
    console.error("Create strategic note error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while creating strategic note" },
      { status: 500 }
    );
  }
}
