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

type Props = {
  threadId: string;
};

export default function ChatWindow({ threadId }: Props) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // ✅ Load messages for this thread
  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat?threadId=${threadId}`);
      const data = await res.json();

      if (res.ok && data.messages) {
        const formatted = data.messages.map((msg: any) => ({
          id: new Date(msg.createdAt).getTime(),
          content: msg.content,
          role: msg.role,
          timestamp: new Date(msg.createdAt).toLocaleTimeString(),
        }));

        setMessages(formatted);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  useEffect(() => {
    if (threadId) fetchMessages();
  }, [threadId]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ✅ Send message with threadId
  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          threadId, // ✅ IMPORTANT
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "API Error");

      const botMessage: MessageType = {
        id: Date.now() + 1,
        content: data?.reply || "⚠️ No response",
        role: "assistant",
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, botMessage]);

      const audio = new Audio("/notification.mp3");
      audio.play().catch(() => {});
    } catch (error) {
      console.error("FRONTEND ERROR:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          content: "⚠️ Error getting response",
          role: "assistant",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex h-screen w-full ${
        darkMode ? "bg-[#131314] text-white" : "bg-white text-black"
      }`}
    >
      {/* Sidebar (placeholder for threads) */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-0"
        } transition-all border-r overflow-hidden`}
      >
        <div className="p-4">
          <button
            onClick={() => setMessages([])}
            className="w-full bg-gray-700 text-white p-2 rounded"
          >
            + New Chat
          </button>
        </div>
      </aside>

      {/* Chat */}
      <main className="flex-1 flex flex-col">
        <header className="p-4 flex justify-between">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            ☰
          </button>
          <h2>Chat</h2>
          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "🌙" : "☀️"}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-4 ${
                msg.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <Message {...msg} />
            </div>
          ))}

          {loading && <div>Typing...</div>}

          <div ref={bottomRef} />
        </div>

        <footer className="p-4">
          <InputArea onSend={sendMessage} />
        </footer>
      </main>
    </div>
  );
}