"use client";

import { useState } from "react";
import Message from "./Message";
import InputArea from "./InputArea";

export default function ChatWindow() {
  const [messages, setMessages] = useState<any[]>([]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: text }),
    });

    const data = await res.json();

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: data.reply },
    ]);
  };

  return (
    <div className="h-screen flex flex-col bg-black text-white">

      {/* HEADER */}
      <div className="p-4 border-b border-gray-700 text-center font-bold text-lg">
        ChatBot UI
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <Message key={i} {...msg} />
        ))}
      </div>

      {/* INPUT */}
      <InputArea onSend={sendMessage} />
    </div>
  );
}