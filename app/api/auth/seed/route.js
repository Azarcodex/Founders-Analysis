import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await connectToDatabase();

    // Check if users already exist
    const count = await User.countDocuments();
    if (count > 0) {
      return NextResponse.json({
        message: "Database already seeded. Founders exist.",
        success: true,
      });
    }

    const defaultPassword = "mallzo2026";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const founders = [
      {
        name: "Azarin",
        email: "azarin@mallzo.com",
        password: hashedPassword,
        avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Azarin",
        status: "Active",
        productivityStats: {
          completionRate: 0,
          totalTasks: 0,
          completedTasks: 0,
          streak: 0,
          contributionScore: 100,
        },
      },
      {
        name: "Najeeb",
        email: "najeeb@mallzo.com",
        password: hashedPassword,
        avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Najeeb",
        status: "Active",
        productivityStats: {
          completionRate: 0,
          totalTasks: 0,
          completedTasks: 0,
          streak: 0,
          contributionScore: 100,
        },
      },
      {
        name: "Rima",
        email: "rima@mallzo.com",
        password: hashedPassword,
        avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Rima",
        status: "Active",
        productivityStats: {
          completionRate: 0,
          totalTasks: 0,
          completedTasks: 0,
          streak: 0,
          contributionScore: 100,
        },
      },
    ];

    await User.insertMany(founders);

    return NextResponse.json({
      message: "Database seeded successfully. Founders added.",
      success: true,
      data: founders.map((f) => ({ name: f.name, email: f.email })),
    });
  } catch (error) {
    console.error("Seeding error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during database seeding: " + error.message },
      { status: 500 }
    );
  }
}
