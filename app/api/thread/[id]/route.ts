import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Thread from "@/models/Thread";
import Message from "@/models/Message";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// ================= RENAME THREAD =================
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ FIXED
) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params; // ✅ IMPORTANT FIX
    const { title } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    const updated = await Thread.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { title },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      _id: updated._id.toString(),
      title: updated.title,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Rename failed" }, { status: 500 });
  }
}

// ================= DELETE THREAD =================
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ FIXED
) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params; // ✅ IMPORTANT FIX

    await Thread.deleteOne({
      _id: id,
      userId: session.user.id,
    });

    await Message.deleteMany({
      threadId: id,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}