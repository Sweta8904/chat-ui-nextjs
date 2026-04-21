import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Thread from "@/models/Thread";
import { getServerSession } from "next-auth";

// ✅ CREATE THREAD
export async function POST() {
  try {
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const thread = await Thread.create({
      userId: session.user.id || session.user.email, // store user
      title: "New Chat",
    });

    return NextResponse.json({ thread });

  } catch (error) {
    console.error("Thread POST Error:", error);

    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 }
    );
  }
}

// ✅ GET ALL THREADS (FOR SIDEBAR)
export async function GET() {
  try {
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const threads = await Thread.find({
      userId: session.user.id || session.user.email,
    }).sort({ createdAt: -1 });

    return NextResponse.json({ threads });

  } catch (error) {
    console.error("Thread GET Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch threads" },
      { status: 500 }
    );
  }
}