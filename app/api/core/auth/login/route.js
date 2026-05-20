import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CoreMember from "@/models/CoreMember";
import bcrypt from "bcryptjs";
import { setCoreAuthCookie } from "@/lib/coreAuth";

export async function POST(request) {
  try {
    await connectToDatabase();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const member = await CoreMember.findOne({ email: email.toLowerCase() });

    if (!member) {
      return NextResponse.json(
        { error: "Core Member account not found" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, member.password);

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Update status and lastActive time
    member.status = "Active";
    member.lastActive = new Date();
    await member.save();

    const payload = {
      id: member._id.toString(),
      name: member.name,
      email: member.email,
      avatar: member.avatar,
      role: "core_member",
    };

    await setCoreAuthCookie(payload);

    return NextResponse.json({
      message: "Logged in successfully",
      success: true,
      user: {
        id: member._id,
        name: member.name,
        email: member.email,
        avatar: member.avatar,
        status: member.status,
      },
    });
  } catch (error) {
    console.error("Core Member login error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during login: " + error.message },
      { status: 500 }
    );
  }
}
