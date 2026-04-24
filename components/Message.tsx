type Props = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export default function Message({ role, content, timestamp }: Props) {
  const isUser = role === "user";

  return (
    <div
      className={`flex flex-col mb-4 ${
        isUser ? "items-end" : "items-start"
      }`}
    >
      {/* Message Bubble */}
      <div
        className={`px-4 py-3 rounded-2xl max-w-[75%] md:max-w-[60%] break-words shadow-lg transition-all ${
          isUser
            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-sm"
            : "bg-gray-800 text-gray-100 rounded-bl-sm"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {content}
        </p>
      </div>

      {/* Timestamp */}
      <span className="text-[11px] text-gray-400 mt-1 px-1">
        {timestamp}
      </span>
    </div>
  );
}