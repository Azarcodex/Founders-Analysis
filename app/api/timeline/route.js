import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ActivityLog from "@/models/ActivityLog";

export async function GET() {
  try {
    await connectToDatabase();

    const activities = await ActivityLog.find({})
      .populate("founder", "name email avatar status")
      .sort({ createdAt: -1 })
      .limit(30);

    return NextResponse.json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error("Fetch timeline error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while fetching timeline activities" },
      { status: 500 }
    );
  }
}
