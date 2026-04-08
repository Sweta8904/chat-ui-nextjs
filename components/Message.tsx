type Props = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export default function Message({ role, content, timestamp }: Props) {
  return (
    
    <div
      className={`flex flex-col mb-3 ${
        role === "user" ? "items-end" : "items-start"
      }`}
    >
      {/* Message Bubble */}
      <div
        className={`px-4 py-2 rounded-2xl max-w-xs md:max-w-md break-words shadow-md ${
          role === "user"
            ? "bg-blue-500 text-white"
            : "bg-gray-300 text-black"
        }`}
      >
        {content}
      </div>

      {/* Timestamp */}
      <span className="text-xs text-gray-400 mt-1">
        {timestamp}
      </span>
    </div>
  );
}