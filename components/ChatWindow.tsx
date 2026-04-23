"use client";

import { useState, useRef, useEffect } from "react";
import Message from "./Message";
import InputArea from "./InputArea";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

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

export default function ChatWindow() {
  const { status } = useSession();
  const router = useRouter();

  const [messages, setMessages] = useState<MessageType[]>([]);
  const [threads, setThreads] = useState<ThreadType[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 🔐 Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // ✅ Fetch threads
  const fetchThreads = async () => {
    try {
      const res = await fetch("/api/thread");
      const data = await res.json();
      if (res.ok) {
        setThreads(data.threads);
        if (data.threads.length > 0 && !activeThread) {
          setActiveThread(data.threads[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to load threads:", err);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchThreads();
    }
  }, [status]);

  // ✅ Fetch messages for active thread
  const fetchMessages = async (threadId: string) => {
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
    if (activeThread) {
      fetchMessages(activeThread);
    }
  }, [activeThread]);

  // ✅ Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ❗ Auth loading
  if (status === "loading") {
    return <div className="text-center mt-10">Checking auth...</div>;
  }

  if (status === "unauthenticated") {
    return null;
  }

  // ✅ Create new thread
  const createThread = async () => {
    try {
      const res = await fetch("/api/thread", {
        method: "POST",
      });

      const newThread = await res.json();

      setThreads((prev) => [newThread, ...prev]);
      setActiveThread(newThread._id);
      setMessages([]);
    } catch (err) {
      console.error("Failed to create thread:", err);
    }
  };

  // ✅ Send message
  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || !activeThread) return;

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
          threadId: activeThread, // ✅ FIXED
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error);

      const botMessage: MessageType = {
        id: Date.now() + 1,
        content: data.reply,
        role: "assistant",
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex h-screen ${darkMode ? "bg-[#131314] text-white" : "bg-white text-black"}`}>
      
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? "w-64" : "w-0"} transition-all border-r overflow-hidden`}>
        <div className="p-4">
          <button
            onClick={createThread}
            className="w-full bg-gray-700 text-white p-2 rounded"
          >
            + New Chat
          </button>

          <div className="mt-4 space-y-2">
            {threads.map((t) => (
              <div
                key={t._id}
                onClick={() => setActiveThread(t._id)}
                className={`p-2 rounded cursor-pointer ${
                  activeThread === t._id ? "bg-gray-600" : "hover:bg-gray-700"
                }`}
              >
                {t.title || "New Chat"}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Chat */}
      <main className="flex-1 flex flex-col">
        <header className="p-4 flex justify-between items-center">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>☰</button>
          <h2>Chat</h2>

          <div className="flex gap-2">
            <button onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? "🌙" : "☀️"}
            </button>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="bg-red-500 px-3 py-1 rounded"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-4 ${msg.role === "user" ? "text-right" : "text-left"}`}
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