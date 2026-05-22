import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import FutureAnalysis from "@/models/FutureAnalysis";
import { getCoreSessionUser } from "@/lib/coreAuth";

export async function GET(request) {
  try {
    const session = await getCoreSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    console.error("Fetch future analysis core error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while fetching strategic notes" },
      { status: 500 }
    );
  }
}
