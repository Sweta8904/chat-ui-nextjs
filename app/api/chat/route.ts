import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import Groq from "groq-sdk";
import axios from "axios";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.3-70b-versatile";

// 🔍 Web search function (Tavily)
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

    // ✅ Save user message
    await Message.create({
      threadId,
      role: "user",
      content: message,
    });

    let context = "";

    // 🔥 1. Web search if needed
    if (shouldSearchWeb(message)) {
      const results = await searchWeb(message);

      context = results
        .map((r: any) => `Title: ${r.title}\nContent: ${r.content}`)
        .join("\n\n");
    }

    let aiReply = "";

    try {
      // 🔥 2. Send context + question to Groq
      const completion = await groq.chat.completions.create({
  messages: [
    {
      role: "system",
      content: context
        ? "You are a smart assistant. Use the provided web results to answer accurately and up-to-date."
        : "You are a helpful assistant.",
    },

    {
      role: "user",
      content: context
        ? `User Question: ${message}

Latest Web Information:
${context}

Give a clear and updated answer based on this data.`
        : message,
    },
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

    // ✅ Save AI reply
    await Message.create({
      threadId,
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