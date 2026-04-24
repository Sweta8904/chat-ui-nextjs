import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Thread from "@/models/Thread";
import Message from "@/models/Message";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// ✅ PATCH (Rename)
export async function PATCH(
  req: NextRequest,
  context: any // ✅ safest fix (avoids TS mismatch in Next 16)
) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params; // ✅ works in all versions
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

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Rename failed" }, { status: 500 });
  }
}

// ✅ DELETE
export async function DELETE(
  req: NextRequest,
  context: any // ✅ same fix
) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    await Thread.deleteOne({
      _id: id,
      userId: session.user.id,
    });

    await Message.deleteMany({
      threadId: id,
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}