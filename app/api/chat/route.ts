import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import Thread from "@/models/Thread";
import Groq from "groq-sdk";
import axios from "axios";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { randomUUID } from "crypto";
import mongoose from "mongoose";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const MODEL = "llama-3.3-70b-versatile";

// 🔍 Web search
async function searchWeb(query: string) {
  try {
    const res = await axios.post(
      "https://api.tavily.com/search",
      {
        query,
        max_results: 3,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
        },
      }
    );

    return res.data.results || [];
  } catch (error) {
    console.error("Web Search Error:", error);
    return [];
  }
}

// 🧠 When to trigger web search
function shouldSearchWeb(query: string) {
  const keywords = [
    "weather",
    "today",
    "news",
    "price",
    "latest",
    "current",
    "stock",
    "temperature",
  ];

  return keywords.some((k) =>
    query.toLowerCase().includes(k)
  );
}

// ================= POST =================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message?.trim();
    const threadId = body.threadId;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // 🔐 Auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    let thread: any = null;

    // 🔍 Try to find valid thread
    if (threadId && mongoose.Types.ObjectId.isValid(threadId)) {
      thread = await Thread.findOne({
        _id: new mongoose.Types.ObjectId(threadId),
        userId,
      });
    }

    // 🔥 Auto-create thread if invalid
    if (!thread) {
      thread = await Thread.create({
        userId,
        title: "New Chat",
      });
    }

    const finalThreadId = thread._id;

    // ✅ Save USER message
    await Message.create({
      messageId: randomUUID(),
      userId,
      threadId: finalThreadId,
      role: "user",
      content: message,
    });

    // 🧠 Update thread title (only once)
    if (thread.title === "New Chat") {
      const title = message.split(" ").slice(0, 5).join(" ");
      await Thread.findByIdAndUpdate(finalThreadId, {
        title,
      });
    }

    // 🔍 Web context
    let context = "";

    if (shouldSearchWeb(message)) {
      const results = await searchWeb(message);

      context = results
        .map((r: any) => `• ${r.title}\n${r.content}`)
        .join("\n\n");
    }

    // 🤖 AI call
    let aiReply = "";

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: context
              ? "Use the web data to give accurate and updated answers."
              : "You are a helpful assistant.",
          },
          {
            role: "user",
            content: context
              ? `${message}\n\nWeb Info:\n${context}`
              : message,
          },
        ],
        model: MODEL,
      });

      aiReply =
        completion.choices[0]?.message?.content ||
        "⚠️ No response from AI";
    } catch (err: any) {
      console.error("Groq Error:", err?.message);

      return NextResponse.json(
        { error: "AI service failed" },
        { status: 500 }
      );
    }

    // ✅ Save AI message
    await Message.create({
      messageId: randomUUID(),
      userId,
      threadId: finalThreadId,
      role: "assistant",
      content: aiReply,
    });

    return NextResponse.json({
      reply: aiReply,
      threadId: finalThreadId.toString(),
    });

  } catch (error) {
    console.error("POST Error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ================= GET =================
export async function GET(req: NextRequest) {
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

    const threadId = req.nextUrl.searchParams.get("threadId");

    if (!threadId || !mongoose.Types.ObjectId.isValid(threadId)) {
      return NextResponse.json(
        { error: "Invalid threadId" },
        { status: 400 }
      );
    }

    const messages = await Message.find({
      threadId: new mongoose.Types.ObjectId(threadId),
      userId,
    }).sort({ createdAt: 1 });

    return NextResponse.json({ messages });

  } catch (error) {
    console.error("GET Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}