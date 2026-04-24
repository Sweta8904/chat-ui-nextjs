import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Thread from "@/models/Thread";
import Message from "@/models/Message";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// ================= RENAME THREAD =================
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { title } = await req.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title required" },
        { status: 400 }
      );
    }

    const updated = await Thread.findOneAndUpdate(
      {
        _id: params.id,
        userId: session.user.id,
      },
      { title },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      _id: updated._id.toString(),
      title: updated.title,
    });

  } catch (error) {
    console.error("Rename error:", error);

    return NextResponse.json(
      { error: "Rename failed" },
      { status: 500 }
    );
  }
}

// ================= DELETE THREAD =================
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // delete thread
    await Thread.deleteOne({
      _id: params.id,
      userId: session.user.id,
    });

    // 🔥 also delete messages
    await Message.deleteMany({
      threadId: params.id,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete error:", error);

    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}