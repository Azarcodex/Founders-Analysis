import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import IdeaNotification from "@/models/IdeaNotification";
import { getCoreSessionUser } from "@/lib/coreAuth";

export async function GET() {
  try {
    const session = await getCoreSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const notifications = await IdeaNotification.find({ recipient: session.id })
      .populate("idea", "title")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Fetch core notifications error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while fetching notifications" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getCoreSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Mark all notifications as read for the user
    await IdeaNotification.updateMany(
      { recipient: session.id, isRead: false },
      { $set: { isRead: true } }
    );

    return NextResponse.json({
      success: true,
      message: "Notifications marked as read",
    });
  } catch (error) {
    console.error("Mark notifications read error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while updating notifications" },
      { status: 500 }
    );
  }
}
