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

// Define the structure for MongoDB history items
type HistoryType = {
  _id: string;
  userMessage: string;
  aiMessage: string;
  createdAt: string;
};

export default function ChatWindow() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [history, setHistory] = useState<HistoryType[]>([]); // ✅ FIXED: Added history state
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  
  // 🔽 1. Fetch History from MongoDB on Page Load
  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/chat"); // Calls the GET method in your route.ts
      const data = await res.json();
      if (res.ok && data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "API Error");

      const botMessage: MessageType = {
        id: Date.now() + 1,
        content: data?.reply || "⚠️ No response from AI",
        role: "assistant",
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, botMessage]);
      
      // ✅ Refresh sidebar history after sending a message
      fetchHistory();

      const audio = new Audio("/notification.mp3");
      audio.play().catch(() => {});
    } catch (error) {
      console.error("FRONTEND ERROR:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          content: "⚠️ Error: Failed to get response",
          role: "assistant",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex h-screen w-full transition-colors duration-300 ${
      darkMode ? "bg-[#131314] text-[#e3e3e3]" : "bg-[#f0f2f5] text-[#1f1f1f]"
    }`}>
      
      {/* 🔹 SIDEBAR (History) */}
      <aside className={`${
        isSidebarOpen ? "w-72" : "w-0 overflow-hidden"
      } transition-all duration-300 flex flex-col border-r h-full z-20 ${
        darkMode ? "bg-[#1e1f20] border-[#303132]" : "bg-[#f8f9fa] border-gray-200"
      }`}>
        
        <div className="p-4">
          <button 
            onClick={() => setMessages([])}
            className={`flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-all shadow-sm w-full ${
              darkMode 
                ? "bg-[#2e2f31] hover:bg-[#3c4043] text-gray-200" 
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <span>+</span> New Chat
          </button>
        </div>

        <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Recent
          </p>
          
          <div className="space-y-1">
            {history.length > 0 ? (
              history.map((item) => (
                <div 
                  key={item._id}
                  className={`group flex items-center justify-between p-3 rounded-lg text-sm transition-all cursor-pointer ${
                    darkMode 
                      ? "hover:bg-[#2e2f31] text-gray-300 hover:text-white" 
                      : "hover:bg-gray-200 text-gray-700 hover:text-black"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate flex-1">
                    <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="truncate">{item.userMessage}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-xs text-gray-500 italic">
                No history found
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-700/50 space-y-1">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-sm hover:bg-gray-500/10"
          >
            <span>{darkMode ? "☀️" : "🌙"}</span>
            {darkMode ? "Light Theme" : "Dark Theme"}
          </button>
        </div>
      </aside>

      {/* 🔹 MAIN CHAT WINDOW */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="p-4 flex items-center justify-between">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-full hover:bg-gray-500/10 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
          </button>
          <div className="font-medium text-lg">Gemini</div>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white">USER</div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {messages.length === 0 && !loading && (
              <div className="h-[50vh] flex flex-col items-start justify-center">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-red-400 bg-clip-text text-transparent mb-2">
                  Hello, friend
                </h1>
                <p className="text-2xl text-gray-500 font-medium">How can I help you today?</p>
              </div>
            )}

            <div className="space-y-10">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-400 mt-1 flex-shrink-0" />
                  )}
                  <div className={`${
                    msg.role === 'user' 
                      ? `max-w-[80%] px-5 py-3 rounded-3xl ${darkMode ? 'bg-[#2e2f31]' : 'bg-gray-200'}` 
                      : 'flex-1'
                  }`}>
                    <Message {...msg} />
                    <span className="block text-[10px] opacity-40 mt-1">{msg.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>

            {loading && (
              <div className="flex gap-4 mt-8 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <footer className="p-4">
          <div className="max-w-3xl mx-auto">
            <InputArea onSend={sendMessage} />
            <p className="text-[11px] text-center text-gray-500 mt-3">
              Gemini may display inaccurate info, including about people, so double-check its responses.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}