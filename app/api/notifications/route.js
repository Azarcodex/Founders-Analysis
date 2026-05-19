import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Fetch notifications where recipient is either null (global) or matches the logged-in user
    const notifications = await Notification.find({
      $or: [
        { recipient: null },
        { recipient: session.id },
      ],
    })
      .populate("creator", "name avatar")
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while fetching notifications" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { notificationIds } = await request.json();

    if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await Notification.updateMany(
        {
          _id: { $in: notificationIds },
          $or: [
            { recipient: null },
            { recipient: session.id },
          ],
        },
        { isRead: true }
      );
    } else {
      // Mark ALL notifications for this user as read
      await Notification.updateMany(
        {
          $or: [
            { recipient: null },
            { recipient: session.id },
          ],
        },
        { isRead: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notifications marked as read",
    });
  } catch (error) {
    console.error("Update notifications error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while updating notifications" },
      { status: 500 }
    );
  }
}
