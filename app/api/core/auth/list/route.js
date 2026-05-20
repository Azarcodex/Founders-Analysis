import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CoreMember from "@/models/CoreMember";

export async function GET() {
  try {
    await connectToDatabase();
    const members = await CoreMember.find({}, "name email avatar status");
    return NextResponse.json({
      success: true,
      members,
    });
  } catch (error) {
    console.error("Fetch core members list error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while fetching core members" },
      { status: 500 }
    );
  }
}
