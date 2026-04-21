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

type ThreadType = {
  _id: string;
  title: string;
};

type Props = {
  threadId: string;
};

export default function ChatWindow({ threadId }: Props) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [threads, setThreads] = useState<ThreadType[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState(threadId);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // ✅ Fetch threads
  const fetchThreads = async () => {
    try {
      const res = await fetch("/api/thread");
      const data = await res.json();
      if (res.ok) {
        setThreads(data.threads || []);
      }
    } catch (err) {
      console.error("Failed to load threads:", err);
    }
  };

  // ✅ Fetch messages for selected thread
  const fetchMessages = async (id: string) => {
    try {
      const res = await fetch(`/api/chat?threadId=${id}`);
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
    fetchThreads();
  }, []);

  useEffect(() => {
    if (currentThreadId) fetchMessages(currentThreadId);
  }, [currentThreadId]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ✅ Send message
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
          threadId: currentThreadId,
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
    } catch (error) {
      console.error("Error:", error);

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

  // ✅ Create new thread
  const createNewChat = async () => {
    try {
      const res = await fetch("/api/thread", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setThreads((prev) => [data.thread, ...prev]);
      setCurrentThreadId(data.thread._id);
      setMessages([]);
    } catch (err) {
      console.error("Failed to create thread:", err);
    }
  };

  return (
    <div className={`flex h-screen w-full ${darkMode ? "bg-[#131314] text-white" : "bg-white text-black"}`}>
      
      {/* ✅ Sidebar */}
      <aside className={`${isSidebarOpen ? "w-64" : "w-0"} transition-all border-r overflow-hidden`}>
        
        <div className="p-4">
          <button
            onClick={createNewChat} // ✅ FIXED HERE
            className="w-full bg-gray-700 text-white p-2 rounded"
          >
            + New Chat
          </button>
        </div>

        <div className="p-2 space-y-2">
          {threads.map((thread) => (
            <div
              key={thread._id}
              onClick={() => setCurrentThreadId(thread._id)}
              className={`p-2 rounded cursor-pointer ${
                currentThreadId === thread._id ? "bg-gray-600" : "hover:bg-gray-700"
              }`}
            >
              {thread.title || "New Chat"}
            </div>
          ))}
        </div>
      </aside>

      {/* ✅ Chat */}
      <main className="flex-1 flex flex-col">
        
        <header className="p-4 flex justify-between">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>☰</button>
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