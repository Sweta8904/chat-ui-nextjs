import ChatWindow from "../components/ChatWindow";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import Thread from "@/models/Thread";

export default async function Home() {
  // ✅ Check authentication
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  await connectDB();

  // ✅ Get user threads
  const threads = await Thread.find({
    userId: session.user?.id || session.user?.email,
  }).sort({ createdAt: -1 });

  // ✅ Ensure at least one thread exists
  let currentThread = threads[0];

  if (!currentThread) {
    currentThread = await Thread.create({
      userId: session.user?.id || session.user?.email,
      title: "New Chat",
    });
  }

  // ✅ ONLY render ChatWindow (no sidebar here)
  return (
    <ChatWindow  />
  );
}