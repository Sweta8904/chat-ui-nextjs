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
  const [darkMode, setDarkMode] = useState(true);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

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

      // 🔔 Sound notification
      const audio = new Audio("/notification.mp3");
      audio.play();
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
    <div
      className={`h-screen flex flex-col ${
        darkMode ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      {/* HEADER */}
      <div className="p-4 border-b border-gray-700 text-center font-bold text-lg relative">
        AI Chatbot

        {/* 🌙 Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="absolute right-4 top-4 text-sm bg-gray-500 px-2 py-1 rounded"
        >
          {darkMode ? "Light" : "Dark"}
        </button>

        {/* 🧹 Clear Chat */}
        <button
          onClick={() => setMessages([])}
          className="absolute left-4 top-4 text-sm bg-red-500 px-2 py-1 rounded"
        >
          Clear
        </button>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <Message key={msg.id} {...msg} />
        ))}

        {/* ✨ Typing Indicator */}
        {loading && (
          <div className="text-gray-400 italic animate-pulse">
            Bot is typing...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <InputArea onSend={sendMessage} />
    </div>
  );
}