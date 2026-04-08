type Props = {
  role: "user" | "assistant";
  content: string;
};

export default function Message({ role, content }: Props) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`px-4 py-2 rounded-2xl max-w-xs break-words ${
          role === "user"
            ? "bg-blue-500 text-white"
            : "bg-gray-700 text-white"
        }`}
      >
        {content}
      </div>
    </div>
  );
}