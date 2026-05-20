import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CoreMember from "@/models/CoreMember";
import Idea from "@/models/Idea";
import IdeaComment from "@/models/IdeaComment";
import IdeaLike from "@/models/IdeaLike";
import IdeaNotification from "@/models/IdeaNotification";
import { getSessionUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const member = await CoreMember.findById(id);

    if (!member) {
      return NextResponse.json({ error: "Core member not found" }, { status: 404 });
    }

    const { name, email, password, avatar, status } = await request.json();

    if (name) member.name = name;
    if (email) {
      const emailLower = email.toLowerCase();
      if (emailLower !== member.email) {
        const existing = await CoreMember.findOne({ email: emailLower });
        if (existing) {
          return NextResponse.json({ error: "Email is already taken" }, { status: 400 });
        }
        member.email = emailLower;
      }
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      member.password = await bcrypt.hash(password, salt);
    }
    if (avatar) member.avatar = avatar;
    if (status) member.status = status;

    await member.save();

    const memberObj = member.toObject();
    delete memberObj.password;

    return NextResponse.json({
      success: true,
      member: memberObj,
    });
  } catch (error) {
    console.error("Founder update core member error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during core member update" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const member = await CoreMember.findById(id);

    if (!member) {
      return NextResponse.json({ error: "Core member not found" }, { status: 404 });
    }

    // Clean up all data associated with this Core Member
    const memberIdeas = await Idea.find({ createdBy: id }, "_id");
    const ideaIds = memberIdeas.map((i) => i._id);

    // Delete comments on member's ideas or made by the member
    await IdeaComment.deleteMany({
      $or: [
        { idea: { $in: ideaIds } },
        { coreMember: id },
      ],
    });

    // Delete likes on member's ideas or made by the member
    await IdeaLike.deleteMany({
      $or: [
        { idea: { $in: ideaIds } },
        { coreMember: id },
      ],
    });

    // Delete notifications received by the member or relating to their ideas
    await IdeaNotification.deleteMany({
      $or: [
        { recipient: id },
        { idea: { $in: ideaIds } },
      ],
    });

    // Delete ideas created by the member
    await Idea.deleteMany({ createdBy: id });

    // Delete the member profile
    await CoreMember.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Core member and all associated contents deleted successfully",
    });
  } catch (error) {
    console.error("Founder delete core member error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during core member deletion" },
      { status: 500 }
    );
  }
}
