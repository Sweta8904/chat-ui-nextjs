"use client";

import { useState, useRef } from "react";

export default function InputArea({ onSend }: any) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // ✅ Auto resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  };

  // ✅ Send message
  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  return (
    <div className="p-4 border-t border-gray-800 bg-[#020617]">
      <div className="flex items-end gap-2 bg-white/5 backdrop-blur-xl px-4 py-3 rounded-2xl border border-gray-700 shadow-[0_0_20px_rgba(0,0,0,0.3)] focus-within:border-blue-500 transition">

        {/* 📎 Icon */}
        <button className="text-gray-400 hover:text-white text-lg">
          📎
        </button>

        {/* ✍️ Input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          placeholder="Ask anything..."
          rows={1}
          className="flex-1 bg-transparent outline-none text-white resize-none max-h-40 placeholder-gray-400 text-sm leading-relaxed"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        {/* 🚀 Send */}
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ➤
        </button>
      </div>
    </div>
  );
}