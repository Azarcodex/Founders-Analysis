import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import IdeaLike from "@/models/IdeaLike";
import Idea from "@/models/Idea";
import IdeaNotification from "@/models/IdeaNotification";
import { getCoreSessionUser } from "@/lib/coreAuth";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const session = await getCoreSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const idea = await Idea.findById(id);
    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // Check if like exists
    const existingLike = await IdeaLike.findOne({
      idea: id,
      coreMember: session.id,
    });

    let liked = false;
    if (existingLike) {
      // Unlike it
      await IdeaLike.findByIdAndDelete(existingLike._id);
    } else {
      // Like it
      await IdeaLike.create({
        idea: id,
        coreMember: session.id,
      });
      liked = true;

      // Notify the creator of the idea if it's not the same person
      if (idea.createdBy.toString() !== session.id) {
        await IdeaNotification.create({
          recipient: idea.createdBy,
          idea: id,
          title: "New Upvote on your Idea",
          description: `${session.name} upvoted your idea "${idea.title}"`,
          type: "like",
        });
      }
    }

    const likesCount = await IdeaLike.countDocuments({ idea: id });

    return NextResponse.json({
      success: true,
      liked,
      likesCount,
    });
  } catch (error) {
    console.error("Toggle like error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while toggling like: " + error.message },
      { status: 500 }
    );
  }
}
