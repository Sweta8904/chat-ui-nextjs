import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ✅ Latest working model
const MODEL = "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  try {
    const { message, threadId } = await req.json();

    // ✅ Validation
    if (!message || !threadId) {
      return NextResponse.json(
        { error: "Message and threadId are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // ✅ 1. Save USER message
    await Message.create({
      threadId,
      role: "user",
      content: message,
    });

    let aiReply = "";

    try {
      // ✅ 2. Call Groq
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: message },
        ],
        model: MODEL,
      });

      aiReply = completion.choices[0]?.message?.content || "";
    } catch (err: any) {
      console.error("Groq Error:", err?.message);

      return NextResponse.json(
        { error: "AI service is busy. Try again." },
        { status: 503 }
      );
    }

    // ✅ 3. Save AI message
    await Message.create({
      threadId,
      role: "assistant",
      content: aiReply,
    });

    // ✅ 4. Return response
    return NextResponse.json({
      reply: aiReply,
    });

  } catch (error: any) {
    console.error("Server Error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ✅ GET messages by threadId
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const threadId = req.nextUrl.searchParams.get("threadId");

    if (!threadId) {
      return NextResponse.json(
        { error: "threadId is required" },
        { status: 400 }
      );
    }

    const messages = await Message.find({ threadId })
      .sort({ createdAt: 1 });

    return NextResponse.json({ messages });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}