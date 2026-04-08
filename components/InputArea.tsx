"use client";

import { useState } from "react";

export default function InputArea({ onSend }: any) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <div className="p-3 border-t border-gray-700 flex gap-2 bg-black">
      <input
        className="flex-1 p-2 rounded-lg bg-gray-800 text-white outline-none"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />

      <button
        onClick={handleSend}
        disabled={!text.trim()}
        className="bg-blue-600 px-4 py-2 rounded-lg disabled:opacity-50"
      >
        Send
      </button>
    </div>
  );
}