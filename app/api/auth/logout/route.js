import { NextResponse } from "next/server";
import { clearAuthCookie, getSessionUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST() {
  try {
    const session = await getSessionUser();
    
    if (session) {
      await connectToDatabase();
      // Set status to Offline upon logging out
      await User.findByIdAndUpdate(session.id, {
        status: "Offline",
        lastActive: new Date()
      });
    }

    await clearAuthCookie();

    return NextResponse.json({
      message: "Logged out successfully",
      success: true,
    });
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during logout" },
      { status: 500 }
    );
  }
}
