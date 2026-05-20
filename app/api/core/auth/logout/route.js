import { NextResponse } from "next/server";
import { clearCoreAuthCookie } from "@/lib/coreAuth";

export async function POST() {
  try {
    await clearCoreAuthCookie();
    return NextResponse.json({
      message: "Logged out successfully",
      success: true,
    });
  } catch (error) {
    console.error("Core logout error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during logout" },
      { status: 500 }
    );
  }
}
