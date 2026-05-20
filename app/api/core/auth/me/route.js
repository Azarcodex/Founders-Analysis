import { NextResponse } from "next/server";
import { getCoreSessionUser } from "@/lib/coreAuth";
import { connectToDatabase } from "@/lib/mongodb";
import CoreMember from "@/models/CoreMember";

export async function GET() {
  try {
    const session = await getCoreSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const member = await CoreMember.findById(session.id).select("-password");

    if (!member) {
      return NextResponse.json(
        { error: "Core Member not found" },
        { status: 404 }
      );
    }

    // Refresh lastActive time
    member.lastActive = new Date();
    await member.save();

    return NextResponse.json({
      success: true,
      user: member,
    });
  } catch (error) {
    console.error("Core Me API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during session fetch" },
      { status: 500 }
    );
  }
}
