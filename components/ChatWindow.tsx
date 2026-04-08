"use client";

import { useState, useRef, useEffect } from "react";
import Message from "./Message";
import InputArea from "./InputArea";

type MessageType = {
  id: number;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
};

export default function ChatWindow() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    const userMessage: MessageType = {
      id: Date.now(),
      content: text,
      role: "user",
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      const botMessage: MessageType = {
        id: Date.now() + 1,
        content: data.reply,
        role: "assistant",
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          content: "Error: Failed to fetch response",
          role: "assistant",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="h-screen flex flex-col bg-black text-white">

      {/* HEADER */}
      <div className="p-4 border-b border-gray-700 text-center font-bold text-lg">
        AI Chatbot
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <Message key={msg.id} {...msg} />
        ))}

        {/* Typing Indicator */}
        {loading && (
          <div className="text-gray-400 italic">Bot is typing...</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <InputArea onSend={sendMessage} />
    </div>
  );
}