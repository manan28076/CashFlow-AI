import { useState, type FormEvent } from "react";
import { Send, Bot, User } from "lucide-react";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { aiService } from "../../services/ai.service";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const ChatBox = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const question = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setIsSending(true);

    try {
      const result = await aiService.chat(question);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.answer },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err instanceof Error ? err.message : "Something went wrong, try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="flex h-[420px] flex-col">
      <h3 className="mb-3 text-sm font-medium text-stone-600">Ask your finance AI</h3>

      <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-stone-500">
            Try: "how much did I spend on food" or "how can I save more money"
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <Bot size={16} className="mt-1 shrink-0 text-orange-600" />
            )}
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-orange-600 text-white"
                  : "bg-stone-100 text-stone-800"
              }`}
            >
              {m.content}
            </div>
            {m.role === "user" && (
              <User size={16} className="mt-1 shrink-0 text-stone-500" />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <Input
          id="chatInput"
          placeholder="Ask about your finances..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" isLoading={isSending} disabled={!input.trim()}>
          <Send size={16} />
        </Button>
      </form>
    </Card>
  );
};
