import { useState, useRef, useEffect, type FormEvent } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Database,
  Trash2,
  Loader2,
  ArrowRight,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  Wrench,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { aiService } from "../../services/ai.service";
import { cn } from "../../utils/cn";
import type { AgentStep, PendingAiAction } from "../../types/ai";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sql?: string;
  steps?: AgentStep[];
  pendingActions?: PendingAiAction[];
  isDataQuery?: boolean;
  isError?: boolean;
  failedQuestion?: string;
}

const QUICK_PROMPTS = [
  "How much did I spend this month?",
  "What is my biggest expense category?",
  "Do I have any unusual or high expenses?",
  "Forecast my spending for the next 30 days",
  "Give me 3 practical ways to save more money",
];

export const ChatBox = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [expandedSqlIdx, setExpandedSqlIdx] = useState<number | null>(null);
  const [expandedStepsIdx, setExpandedStepsIdx] = useState<number | null>(null);
  const [actionProcessingId, setActionProcessingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;

    const question = text.trim();
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setIsSending(true);

    // Format conversation history
    const history = messages.slice(-6).map((m) => ({
      role: m.role as "user" | "assistant",
      text: m.content,
    }));

    try {
      // First try autonomous tool-calling agent endpoint (/api/ai/agent)
      try {
        const agentResult = await aiService.agent(question, history);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: agentResult.answer || "I analyzed your request and provided details above.",
            steps: agentResult.steps,
            pendingActions: agentResult.pendingActions,
            isDataQuery: (agentResult.steps || []).some((s) => s.tool === "run_sql"),
          },
        ]);
        return;
      } catch (agentErr) {
        // Fallback to existing chat endpoint (/api/ai/chat)
        const result = await aiService.chat(question);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.answer || "I reviewed your data and answered above.",
            sql: result.sql,
            isDataQuery: result.intent === "DATA_QUERY",
          },
        ]);
      }
    } catch (err) {
      let friendlyError = "Something went wrong. Please try again.";
      if (err instanceof Error) {
        const raw = err.message;
        if (raw.includes("503") || raw.includes("high demand") || raw.includes("UNAVAILABLE")) {
          friendlyError =
            "Google AI is temporarily experiencing high traffic. Please tap Retry below to ask again.";
        } else if (raw.includes("429") || raw.includes("quota") || raw.includes("RESOURCE_EXHAUSTED")) {
          friendlyError = "AI rate limit reached. Please wait a moment and tap Retry.";
        } else {
          friendlyError = raw;
        }
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: friendlyError,
          isError: true,
          failedQuestion: question,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleActionConfirm = async (actionId: string, cancel = false) => {
    setActionProcessingId(actionId);
    try {
      const res = await aiService.confirmAction(actionId, cancel);
      setMessages((prev) =>
        prev.map((msg) => {
          if (!msg.pendingActions) return msg;
          return {
            ...msg,
            pendingActions: msg.pendingActions.map((act) => {
              if (act.actionId === actionId) {
                return { ...act, status: res.status || (cancel ? "CANCELLED" : "CONFIRMED") };
              }
              return act;
            }),
          };
        })
      );
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to process action");
    } finally {
      setActionProcessingId(null);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <Card className="flex h-[560px] flex-col border border-stone-200/90 dark:border-blue-900/40 bg-white dark:bg-[#111c35] p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white shadow-xs">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">
              Autonomous Financial Agent
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-slate-400">
              Tool-calling copilot &bull; SQL analysis, forecasting &amp; safe pending write actions
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1 text-xs text-stone-400 dark:text-slate-400 hover:text-stone-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Clear chat"
          >
            <Trash2 size={13} />
            Clear
          </button>
        )}
      </div>

      {/* Messages stream */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3.5 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-stone-200 dark:scrollbar-thumb-slate-800"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="h-12 w-12 rounded-2xl bg-orange-50 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-3 shadow-2xs">
              <Bot size={26} />
            </div>
            <h4 className="text-sm font-semibold text-stone-800 dark:text-white mb-1">
              What would you like to know or do with your finances?
            </h4>
            <p className="text-xs text-stone-500 dark:text-slate-400 max-w-sm mb-4">
              I can execute secure database queries, forecast run rates, summarize category spending,
              or stage new transactions and budgets for your confirmation.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="flex items-center justify-between gap-2 rounded-xl border border-stone-200 dark:border-blue-900/40 bg-stone-50/70 dark:bg-[#0c1426] p-2.5 text-left text-xs font-medium text-stone-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-blue-950/70 hover:border-orange-200 dark:hover:border-blue-700/60 hover:text-orange-950 dark:hover:text-white transition-all cursor-pointer group"
                >
                  <span className="line-clamp-1">{prompt}</span>
                  <ArrowRight
                    size={13}
                    className="text-stone-400 dark:text-slate-500 group-hover:text-orange-600 dark:group-hover:text-blue-400 shrink-0 transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex gap-2.5", m.role === "user" ? "justify-end" : "justify-start")}
            >
              {m.role === "assistant" && (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600 text-white shrink-0 mt-0.5 shadow-2xs">
                  <Bot size={15} />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-orange-600 text-white rounded-br-xs shadow-xs"
                    : "bg-stone-100 dark:bg-[#0c1426] text-stone-800 dark:text-slate-200 rounded-bl-xs border border-stone-200/60 dark:border-blue-900/40"
                )}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Collapsible Steps ("How I got this answer") */}
                {m.steps && m.steps.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-stone-200/80 dark:border-slate-800/80">
                    <button
                      onClick={() => setExpandedStepsIdx(expandedStepsIdx === i ? null : i)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-orange-700 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 cursor-pointer"
                    >
                      <Wrench size={12} />
                      <span>
                        How I got this answer ({m.steps.length} tool {m.steps.length === 1 ? "step" : "steps"})
                      </span>
                      {expandedStepsIdx === i ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    {expandedStepsIdx === i && (
                      <div className="mt-2 space-y-1.5 rounded-lg bg-stone-50 dark:bg-[#111c35] p-2.5 border border-stone-200/60 dark:border-blue-900/40 text-[11px]">
                        {m.steps.map((step, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex flex-col gap-0.5 border-b border-stone-200/40 dark:border-slate-800/40 pb-1.5 last:border-b-0 last:pb-0"
                          >
                            <div className="flex items-center justify-between font-mono text-[10px] text-stone-500 dark:text-slate-400">
                              <span className="font-bold text-orange-600 dark:text-orange-400">
                                Step {sIdx + 1}: {step.tool}
                              </span>
                              <span>{step.latencyMs}ms</span>
                            </div>
                            <div className="text-stone-700 dark:text-slate-300">{step.summary}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Pending Actions (Confirm / Cancel) */}
                {m.pendingActions && m.pendingActions.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-stone-200/80 dark:border-slate-800/80 pt-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <Clock size={12} /> Requires Confirmation
                    </div>
                    {m.pendingActions.map((act) => {
                      const isConfirmed = act.status === "CONFIRMED";
                      const isCancelled = act.status === "CANCELLED";
                      const isBusy = actionProcessingId === act.actionId;

                      return (
                        <div
                          key={act.actionId}
                          className="rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 p-3 text-xs flex flex-col gap-2"
                        >
                          <div className="font-medium text-stone-800 dark:text-slate-200">
                            {act.summary}
                          </div>

                          {isConfirmed ? (
                            <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                              <CheckCircle2 size={14} /> Confirmed &amp; Executed
                            </div>
                          ) : isCancelled ? (
                            <div className="flex items-center gap-1.5 font-bold text-stone-500 dark:text-slate-400 text-[11px]">
                              <XCircle size={14} /> Cancelled
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => handleActionConfirm(act.actionId, false)}
                                disabled={isBusy}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 font-semibold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {isBusy && <Loader2 size={12} className="animate-spin" />}
                                Confirm &amp; Execute
                              </button>
                              <button
                                onClick={() => handleActionConfirm(act.actionId, true)}
                                disabled={isBusy}
                                className="rounded-lg border border-stone-300 dark:border-slate-700 hover:bg-stone-200 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-300 px-3 py-1 font-semibold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Fallback SQL View for chat endpoint */}
                {m.isDataQuery && m.sql && (
                  <div className="mt-2.5 pt-2 border-t border-stone-200/80 dark:border-slate-800/80">
                    <button
                      onClick={() => setExpandedSqlIdx(expandedSqlIdx === i ? null : i)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 cursor-pointer"
                    >
                      <Database size={12} />
                      <span>{expandedSqlIdx === i ? "Hide SQL query" : "Verified with real DB query"}</span>
                    </button>
                    {expandedSqlIdx === i && (
                      <pre className="mt-1.5 p-2 rounded-lg bg-stone-900 text-emerald-300 text-[10px] font-mono overflow-x-auto">
                        {m.sql}
                      </pre>
                    )}
                  </div>
                )}

                {m.isError && m.failedQuestion && (
                  <button
                    onClick={() => sendMessage(m.failedQuestion!)}
                    disabled={isSending}
                    className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-stone-900 text-stone-200 hover:text-white px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <RefreshCw size={12} className={cn(isSending && "animate-spin")} />
                    <span>Retry Question</span>
                  </button>
                )}
              </div>
              {m.role === "user" && (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-slate-200 shrink-0 mt-0.5">
                  <User size={15} />
                </div>
              )}
            </div>
          ))
        )}

        {isSending && (
          <div className="flex items-center gap-2.5 text-stone-500 dark:text-slate-400">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600 text-white shrink-0 shadow-2xs">
              <Bot size={15} />
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              <Loader2 size={14} className="animate-spin text-orange-600" />
              <span>Analyzing financial records and running tools...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-stone-100 dark:border-slate-800/80">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about spending, budgets, forecasts, or add a transaction..."
            disabled={isSending}
            className="flex-1 rounded-xl border border-stone-300 dark:border-blue-900/50 bg-stone-50/50 dark:bg-[#0c1426] px-4 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 focus:border-orange-500 focus:outline-hidden focus:ring-1 focus:ring-orange-500 transition-all disabled:opacity-60"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isSending}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 shrink-0 rounded-xl cursor-pointer disabled:opacity-50"
          >
            {isSending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </Button>
        </div>
      </form>
    </Card>
  );
};
