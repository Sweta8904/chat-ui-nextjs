import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Thread from "@/models/Thread";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// ✅ CREATE THREAD
export async function POST() {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ ALWAYS use same userId (NO email fallback)
    const userId = session.user.id;

    const thread = await Thread.create({
      userId,
      title: "New Chat",
    });

    return NextResponse.json({
      ...thread.toObject(),
      _id: thread._id.toString(), // ✅ frontend safe
    });

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
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const threads = await Thread.find({ userId }).sort({
      createdAt: -1,
    });

    return NextResponse.json({
      threads: threads.map((t) => ({
        ...t.toObject(),
        _id: t._id.toString(), // ✅ fix React key + frontend
      })),
    });

  } catch (error) {
    console.error("Thread GET Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch threads" },
      { status: 500 }
    );
  }
}