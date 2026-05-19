import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(session.id).select("-password");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Refresh lastActive time
    user.lastActive = new Date();
    await user.save();

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Me API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during session fetch" },
      { status: 500 }
    );
  }
}
