import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Thread from "@/models/Thread";
import Message from "@/models/Message";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// ================= CREATE THREAD =================
export async function POST() {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const thread = await Thread.create({
      userId: session.user.id,
      title: "New Chat",
    });

    return NextResponse.json({
      success: true,
      _id: thread._id.toString(), // 🔥 IMPORTANT FIX
      title: thread.title,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, error: "Failed to create thread" },
      { status: 500 }
    );
  }
}

// ================= GET THREADS =================
export async function GET() {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const threads = await Thread.find({
      userId: session.user.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    const result = await Promise.all(
      threads.map(async (t: any) => {
        const count = await Message.countDocuments({
          threadId: t._id,
        });

        return {
          _id: t._id.toString(),
          title: t.title || "New Chat",
          messagesCount: count,
        };
      })
    );

    return NextResponse.json({
      success: true,
      threads: result,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch threads" },
      { status: 500 }
    );
  }
}