import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { setAuthCookie } from "@/lib/auth";

export async function POST(request) {
  try {
    await connectToDatabase();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required,please type" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { error: "Founder account not found" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Update status to Active and lastActive to now
    user.status = "Active";
    user.lastActive = new Date();
    await user.save();

    const payload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    };

    await setAuthCookie(payload);

    return NextResponse.json({
      message: "Logged in successfully",
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        productivityStats: user.productivityStats,
      },
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during login: " + error.message },
      { status: 500 }
    );
  }
}
