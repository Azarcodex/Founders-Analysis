import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CoreMember from "@/models/CoreMember";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await connectToDatabase();

    // Clear any existing core members to reset to correct list
    await CoreMember.deleteMany({});

    const defaultPassword = "mallzo2026";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const defaultMembers = [
      {
        name: "Faeesa",
        email: "faeesa@mallzo.com",
        password: hashedPassword,
        avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Faeesa",
        status: "Active",
      },
      {
        name: "Junaid",
        email: "junaid@mallzo.com",
        password: hashedPassword,
        avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Junaid",
        status: "Active",
      },
    ];

    await CoreMember.insertMany(defaultMembers);

    return NextResponse.json({
      message: "Core members seeded successfully.",
      success: true,
      data: defaultMembers.map((m) => ({ name: m.name, email: m.email })),
    });
  } catch (error) {
    console.error("Seeding core members error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during core member seeding: " + error.message },
      { status: 500 }
    );
  }
}
