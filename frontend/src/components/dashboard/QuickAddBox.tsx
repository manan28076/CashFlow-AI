import { useState } from "react";
import toast from "react-hot-toast";
import { Sparkles, Mic, PlusCircle, Check, Loader2 } from "lucide-react";
import api from "../../services/api";
import { transactionService } from "../../services/transaction.service";
import { accountService } from "../../services/account.service";
import type { ApiResponse } from "../../types/api";

interface ParsedQuickTx {
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  categoryId: string;
  categoryName: string;
  description: string;
  date: string;
}

interface QuickAddBoxProps {
  onTransactionAdded: () => void;
}

export const QuickAddBox = ({ onTransactionAdded }: QuickAddBoxProps) => {
  const [text, setText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedTx, setParsedTx] = useState<ParsedQuickTx | null>(null);
  const [isListening, setIsListening] = useState(false);

  const handleSpeech = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast("Listening...", { icon: "🎙️" });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setText(transcript);
      handleParse(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Could not capture audio. Please try again.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleParse = async (inputStr?: string) => {
    const query = inputStr || text;
    if (!query.trim()) return;

    setIsParsing(true);
    setParsedTx(null);
    try {
      const res = await api.post<ApiResponse<ParsedQuickTx>>("/ai/quick-add", { text: query });
      setParsedTx(res.data.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse transaction");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    if (!parsedTx) return;

    setIsSaving(true);
    try {
      const accounts = await accountService.getAll();
      let accountId = accounts[0]?.id;

      if (!accountId) {
        const created = await accountService.create({
          name: "Primary Account",
          bankName: "Bank / Wallet",
        });
        accountId = created.id;
      }

      await transactionService.create({
        accountId,
        categoryId: parsedTx.categoryId,
        amount: parsedTx.amount,
        type: parsedTx.type,
        merchant: parsedTx.description,
        description: parsedTx.description,
        date: parsedTx.date,
      });

      toast.success(`Saved ₹${parsedTx.amount} (${parsedTx.description})!`);
      setText("");
      setParsedTx(null);
      onTransactionAdded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save transaction");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50/70 via-white to-amber-50/50 p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-900">
            <Sparkles size={14} className="text-orange-600" />
            <span>AI Quick Add</span>
          </div>
          <span className="text-[11px] text-stone-500">
            e.g. "zomato 350", "chai 40 yesterday", "salary 50000"
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleParse();
                }
              }}
              placeholder="Type or speak a transaction..."
              disabled={isParsing || isSaving}
              className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-3 pr-10 text-sm text-stone-800 placeholder-stone-400 shadow-sm focus:border-orange-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSpeech}
              title="Voice input"
              className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 transition-colors ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              }`}
            >
              <Mic size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleParse()}
            disabled={isParsing || !text.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-700 disabled:opacity-50"
          >
            {isParsing ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
            <span>Parse</span>
          </button>
        </div>

        {/* Parsed Confirmation Chip */}
        {parsedTx && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/80 p-2.5 text-xs text-emerald-900 animate-in fade-in">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-emerald-800">{parsedTx.description}</span>
              <span className="rounded bg-white px-2 py-0.5 font-mono font-bold shadow-xs">
                {parsedTx.type === "INCOME" ? "+" : "-"}₹{parsedTx.amount}
              </span>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                {parsedTx.categoryName}
              </span>
              <span className="text-stone-500 font-mono text-[11px]">({parsedTx.date})</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setParsedTx(null)}
                className="text-stone-500 hover:text-stone-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Confirm & Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
