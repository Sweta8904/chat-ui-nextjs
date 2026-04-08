type Props = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export default function Message({ role, content, timestamp }: Props) {
  return (
    <div className={`flex flex-col ${role === "user" ? "items-end" : "items-start"}`}>
      
      <div
        className={`px-4 py-2 rounded-2xl max-w-xs break-words ${
          role === "user"
            ? "bg-blue-500 text-white"
            : "bg-gray-700 text-white"
        }`}
      >
        {content}
      </div>

      <span className="text-xs text-gray-400 mt-1">
        {timestamp}
      </span>
    </div>
  );
}