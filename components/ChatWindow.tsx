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
        setThreads(data.threads || []);

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

  // ✅ Fetch messages
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

  if (status === "loading") {
    return <div className="text-center mt-10">Checking auth...</div>;
  }

  if (status === "unauthenticated") {
    return null;
  }

  // ✅ Create thread
  const createThread = async () => {
    try {
      const res = await fetch("/api/thread", { method: "POST" });
      const newThread = await res.json();

      setThreads((prev) => [newThread, ...prev]);
      setActiveThread(newThread._id);
      setMessages([]);
    } catch (err) {
      console.error("Thread creation failed:", err);
    }
  };

  // ✏️ Rename thread
  const renameThread = async (id: string) => {
    const newTitle = prompt("Enter new title");
    if (!newTitle) return;

    try {
      await fetch(`/api/thread/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      fetchThreads();
    } catch (err) {
      console.error("Rename failed:", err);
    }
  };

  // 🗑 Delete thread
  const deleteThread = async (id: string) => {
    try {
      await fetch(`/api/thread/${id}`, {
        method: "DELETE",
      });

      setThreads((prev) => prev.filter((t) => t._id !== id));

      if (activeThread === id) {
        setActiveThread(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // ✅ Send message (UNCHANGED)
  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    let threadId = activeThread;

    try {
      if (!threadId) {
        const res = await fetch("/api/thread", { method: "POST" });
        const newThread = await res.json();

        const createdId = newThread._id || newThread.thread?._id;

        setThreads((prev) => [
          { _id: createdId, title: "New Chat" },
          ...prev,
        ]);

        setActiveThread(createdId);
        threadId = createdId;
      }

      const userMessage: MessageType = {
        id: Date.now(),
        content: text,
        role: "user",
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, threadId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error);

      if (data.threadId) setActiveThread(data.threadId);

      const botId = Date.now() + 1;

      setMessages((prev) => [
        ...prev,
        {
          id: botId,
          content: "",
          role: "assistant",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      let currentText = "";

      for (let i = 0; i < data.reply.length; i++) {
        currentText += data.reply[i];

        await new Promise((res) => setTimeout(res, 10));

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botId
              ? { ...msg, content: currentText }
              : msg
          )
        );
      }

    } catch (error) {
      console.error(error);
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
            {threads.map((t, index) => (
              <div
                key={t._id?.toString() || index}
                className={`p-2 rounded ${
                  activeThread === t._id ? "bg-gray-600" : "hover:bg-gray-700"
                }`}
              >
                {/* Click thread */}
                <div onClick={() => setActiveThread(t._id)} className="cursor-pointer">
                  {t.title || "New Chat"}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-1 text-xs">
                  <button onClick={() => renameThread(t._id)}>✏️</button>
                  <button onClick={() => deleteThread(t._id)}>🗑</button>
                </div>
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
            <div key={msg.id} className={`mb-4 ${msg.role === "user" ? "text-right" : "text-left"}`}>
              <Message {...msg} />
            </div>
          ))}

          {loading && <div className="text-gray-400">Typing...</div>}

          <div ref={bottomRef} />
        </div>

        <footer className="p-4">
          <InputArea onSend={sendMessage} />
        </footer>
      </main>
    </div>
  );
}