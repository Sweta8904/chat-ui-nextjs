import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Simulate delay (1.5 sec)
  await new Promise((res) => setTimeout(res, 1500));

  const responses = [
    "Hello! How can I help you?",
    "That's interesting 🤔",
    "Can you tell me more?",
    "I'm just a mock bot 😄",
    "Nice question!"
  ];

  const randomReply =
    responses[Math.floor(Math.random() * responses.length)];

  return NextResponse.json({
    reply: randomReply + " (You said: " + body.message + ")",
  });
}