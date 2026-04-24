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
  title?: string;
};

export default function ChatWindow() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [messages, setMessages] = useState<MessageType[]>([]);
  const [threads, setThreads] = useState<ThreadType[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);
useEffect(() => {
  audioRef.current = new Audio("/notification.mp3");
}, []);
  // 🔐 Redirect
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
        const threadList = data.threads || [];

        setThreads(threadList);

        if (threadList.length > 0 && !activeThread) {
          setActiveThread(threadList[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchThreads();
  }, [status]);

  // ✅ Fetch messages
  const fetchMessages = async (threadId: string) => {
    try {
      const res = await fetch(`/api/chat?threadId=${threadId}`);
      const data = await res.json();

      if (res.ok) {
        setMessages(
          (data.messages || []).map((m: any) => ({
            id: new Date(m.createdAt).getTime(),
            content: m.content,
            role: m.role,
            timestamp: new Date(m.createdAt).toLocaleTimeString(),
          }))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeThread) fetchMessages(activeThread);
  }, [activeThread]);

  // ✅ Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (status === "loading") return <div className="text-center mt-10">Loading...</div>;
  if (status === "unauthenticated") return null;

  // 🔍 Safe search
  const filteredThreads = threads.filter((t) =>
    (t.title || "New Chat")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // ✅ Create thread
  const createThread = async () => {
    try {
      const res = await fetch("/api/thread", { method: "POST" });
      const data = await res.json();

      const newThread = data.thread || data;

      if (!newThread?._id) return;

      setThreads((prev) => [newThread, ...prev]);
      setActiveThread(newThread._id);
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  // ✏️ Rename
  const renameThread = async (id: string) => {
    const title = prompt("New name");
    if (!title) return;

    await fetch(`/api/thread/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    fetchThreads();
  };

  // 🗑 Delete
  const deleteThread = async (id: string) => {
    await fetch(`/api/thread/${id}`, { method: "DELETE" });

    setThreads((prev) => prev.filter((t) => t._id !== id));

    if (activeThread === id) {
      setActiveThread(null);
      setMessages([]);
    }
  };

  // 💬 Send message
  const sendMessage = async (text: string) => {
  if (!text.trim() || loading) return;

  let threadId = activeThread;
  const tempId = Date.now() + 1;

  try {
    // ✅ Create thread if not exists
    if (!threadId) {
      const res = await fetch("/api/thread", { method: "POST" });
      const data = await res.json();
      const t = data.thread || data;

      if (!t?._id) throw new Error("Invalid thread");

      setThreads((p) => [t, ...p]);
      setActiveThread(t._id);
      threadId = t._id;
    }

    // ✅ Properly typed user message
    const userMsg: MessageType = {
      id: Date.now(),
      content: text,
      role: "user",
      timestamp: new Date().toLocaleTimeString(),
    };

    // ✅ Properly typed assistant placeholder
    const assistantMsg: MessageType = {
      id: tempId,
      content: "Thinking...",
      role: "assistant",
      timestamp: new Date().toLocaleTimeString(),
    };

    // ✅ Safe state update
    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    setLoading(true);

    // ✅ API call
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: text, threadId }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data?.error);

    // ✅ Update assistant message
    setMessages((p) =>
  p.map((m) =>
    m.id === tempId ? { ...m, content: data.reply } : m
  )
);

// 🔔 Play sound AFTER AI reply
audioRef.current?.play().catch(() => {});

  } catch (err) {
    console.error(err);

    // ✅ Handle error safely
    setMessages((prev) =>
      prev.map((m) =>
        m.id === tempId
          ? { ...m, content: "⚠️ Error getting response" }
          : m
      )
    );
  } finally {
    setLoading(false);
  }
};

  return (
  <div className="flex h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-black text-white">

    {/* Sidebar */}
    <aside className="w-64 bg-[#020617]/80 backdrop-blur border-r border-gray-800 p-4 hidden md:block">
      <button
        onClick={createThread}
        className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded-lg font-medium"
      >
        + New Chat
      </button>

      <div className="mt-4 space-y-2">
        {threads.map((t) => (
          <div
            key={t._id}
            className={`p-3 rounded-lg cursor-pointer transition ${
              activeThread === t._id
                ? "bg-gray-800"
                : "hover:bg-gray-900"
            }`}
          >
            <div onClick={() => setActiveThread(t._id)}>
              {t.title || "New Chat"}
            </div>

            <div className="flex gap-2 text-xs mt-1 opacity-60">
              <button onClick={() => renameThread(t._id)}>✏️</button>
              <button onClick={() => deleteThread(t._id)}>🗑</button>
            </div>
          </div>
        ))}
      </div>
    </aside>

    {/* Chat */}
    <main className="flex-1 flex flex-col items-center">

      {/* Header */}
      <header className="w-full max-w-3xl px-4 py-3 flex justify-between items-center backdrop-blur bg-white/5 border-b border-gray-800">
        <h2 className="text-lg font-semibold tracking-wide">
          MetaWorks UI Chat
        </h2>

        <div className="flex items-center gap-3">
          <img
            src={session?.user?.image || "/avatar.png"}
            className="w-8 h-8 rounded-full"
          />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="bg-red-500 px-3 py-1 rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 w-full max-w-3xl overflow-y-auto px-4 py-6 space-y-4">

        {messages.length === 0 && (
          <div className="text-center mt-32 text-gray-400">
            <h2 className="text-2xl font-semibold mb-2">
              Ask anything ✨
            </h2>
            <p className="text-sm">Start your conversation</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-lg ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-gray-800 text-gray-100 rounded-bl-none"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-gray-400 animate-pulse">
            Meta ai is thinking...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <footer className="w-full max-w-3xl p-4 border-t border-gray-800">
        <InputArea onSend={sendMessage} />
      </footer>
    </main>
  </div>
);}