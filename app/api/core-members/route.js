import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CoreMember from "@/models/CoreMember";
import Idea from "@/models/Idea";
import IdeaLike from "@/models/IdeaLike";
import { getSessionUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const members = await CoreMember.find({}).select("-password").lean();

    // Enrich core members with basic stats for listing
    const enrichedMembers = await Promise.all(
      members.map(async (member) => {
        const totalIdeas = await Idea.countDocuments({ createdBy: member._id });
        const approvedIdeas = await Idea.countDocuments({
          createdBy: member._id,
          status: "Approved",
        });
        
        // Idea Engagement Score: Total likes received on their ideas
        const memberIdeas = await Idea.find({ createdBy: member._id }, "_id");
        const ideaIds = memberIdeas.map((i) => i._id);
        const totalLikes = await IdeaLike.countDocuments({ idea: { $in: ideaIds } });

        return {
          ...member,
          totalIdeas,
          approvedIdeas,
          totalLikes,
        };
      })
    );

    return NextResponse.json({
      success: true,
      members: enrichedMembers,
    });
  } catch (error) {
    console.error("Founder fetch core members error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while fetching core members" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { name, email, password, avatar } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    const existingMember = await CoreMember.findOne({ email: email.toLowerCase() });
    if (existingMember) {
      return NextResponse.json(
        { error: "Email already registered for another core member" },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newMember = await CoreMember.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      avatar: avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      status: "Active",
    });

    const memberObj = newMember.toObject();
    delete memberObj.password;

    return NextResponse.json({
      success: true,
      member: memberObj,
    });
  } catch (error) {
    console.error("Founder register core member error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while registering core member" },
      { status: 500 }
    );
  }
}
