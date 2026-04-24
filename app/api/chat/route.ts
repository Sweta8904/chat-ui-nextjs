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
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.3-70b-versatile";

// 🔍 Web search
async function searchWeb(query: string) {
  try {
    const res = await axios.post(
      "https://api.tavily.com/search",
      { query, max_results: 3 },
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

// 🧠 Decide when to use web
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

export async function POST(req: NextRequest) {
  try {
    const { message, threadId } = await req.json();

    if (!message || !threadId) {
      return NextResponse.json(
        { error: "Message and threadId are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // 🔐 AUTH
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(threadId)) {
      return NextResponse.json(
        { error: "Invalid threadId format" },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const threadObjectId = new mongoose.Types.ObjectId(threadId);

    // 🔐 THREAD CHECK
    const thread = await Thread.findOne({
      _id: threadObjectId,
      userId,
    });

    if (!thread) {
      return NextResponse.json(
        { error: "Invalid thread" },
        { status: 403 }
      );
    }

    const cleanMessage = message.trim();

    // ✅ Save USER message
    await Message.create({
      messageId: randomUUID(),
      userId,
      threadId: threadObjectId,
      role: "user",
      content: cleanMessage,
    });

    // 🔥 UPDATE THREAD TITLE (IMPORTANT FIX)
    if (thread.title === "New Chat") {
      await Thread.findByIdAndUpdate(threadObjectId, {
        title: cleanMessage.substring(0, 30),
      });
    }

    let context = "";

    // 🔍 Web search
    if (shouldSearchWeb(cleanMessage)) {
      const results = await searchWeb(cleanMessage);

      context = results
        .map((r: any) => `• ${r.title}\n${r.content}`)
        .join("\n\n");
    }

    let aiReply = "";

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: context
              ? "You are a smart assistant. Use web results to give accurate answers."
              : "You are a helpful assistant.",
          },
          {
            role: "user",
            content: context
              ? `User Question: ${cleanMessage}

Web Data:
${context}

Answer clearly using this information.`
              : cleanMessage,
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
        { error: "AI service is busy. Try again." },
        { status: 503 }
      );
    }

    // ✅ Save AI message
    await Message.create({
      messageId: randomUUID(),
      userId,
      threadId: threadObjectId,
      role: "assistant",
      content: aiReply,
    });

    return NextResponse.json({ reply: aiReply });

  } catch (error: any) {
    console.error("Server Error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ✅ GET messages
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const threadId = req.nextUrl.searchParams.get("threadId");

    if (!threadId) {
      return NextResponse.json(
        { error: "threadId is required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(threadId)) {
      return NextResponse.json(
        { error: "Invalid threadId format" },
        { status: 400 }
      );
    }

    const threadObjectId = new mongoose.Types.ObjectId(threadId);

    const thread = await Thread.findOne({
      _id: threadObjectId,
      userId,
    });

    // 🔥 AUTO-FIX INVALID THREAD
let validThreadId = threadObjectId;

if (!thread) {
  console.warn("Invalid thread → creating new thread");

  const newThread = await Thread.create({
    userId,
    title: "New Chat",
  });

  validThreadId = newThread._id;
}

    const messages = await Message.find({
      threadId: threadObjectId,
      userId,
    }).sort({ createdAt: 1 });

    return NextResponse.json({ messages });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}