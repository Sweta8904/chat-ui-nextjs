import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";

/**
 * ✅ POST: Sends message to Gemini and SAVES to MongoDB
 */
export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // ✅ UPDATED MODEL: Using gemini-2.5-flash for 2026 compatibility
    const MODEL_NAME = "gemini-2.5-flash";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: message }],
          },
        ],
      }),
    });

    const data = await response.json();

    // ❗ Handle API error properly
    if (!response.ok) {
      return NextResponse.json(
        { 
          error: data?.error?.message || "Gemini API error",
          code: data?.error?.status || "API_FAILURE"
        },
        { status: response.status }
      );
    }

    // ✅ Safe extraction of the AI response
    const aiReply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from Gemini";

    // 💾 Save to MongoDB
    const newMessage = await Message.create({
      userMessage: message,
      aiMessage: aiReply,
    });

    return NextResponse.json({ reply: aiReply, savedMessage: newMessage });

  } catch (error: any) {
    console.error("FINAL ERROR:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * ✅ GET: Fetches chat history from MongoDB for the Sidebar
 */
export async function GET() {
  try {
    await connectDB();

    // Fetch the latest 30 messages, sorted by newest first
    const history = await Message.find()
      .sort({ createdAt: -1 })
      .limit(30);

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error("HISTORY FETCH ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch history", details: error.message },
      { status: 500 }
    );
  }
}