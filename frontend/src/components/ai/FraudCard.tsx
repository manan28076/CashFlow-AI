import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Card } from "../ui/Card";
import { cn } from "../../utils/cn";
import type { FraudResult } from "../../types/ai";

const riskColor: Record<string, string> = {
  LOW: "text-emerald-700 bg-emerald-50 border-emerald-200",
  MEDIUM: "text-amber-700 bg-amber-50 border-amber-200",
  HIGH: "text-rose-700 bg-rose-50 border-rose-200",
};

export const FraudCard = ({ data }: { data: FraudResult | null }) => {
  const isClean = !data || (data.risk === "LOW" && data.flaggedIds.length === 0);

  return (
    <Card className="flex flex-col gap-3 border border-stone-200/90 dark:border-blue-900/40 bg-white dark:bg-[#111c35] p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-700 dark:text-slate-300">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              isClean
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
            )}
          >
            {isClean ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
          </div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-white">Anomaly & Risk</h3>
        </div>
        {data && (
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-bold",
              riskColor[data.risk] ?? riskColor.LOW
            )}
          >
            {data.risk} RISK
          </span>
        )}
      </div>

      {data ? (
        <div className="flex flex-col gap-2.5">
          <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed font-medium">
            {data.reason || (isClean ? "No anomalous or suspicious debits identified." : "Review flagged items.")}
          </p>
          <div
            className={cn(
              "rounded-xl border p-2.5 text-[11px]",
              data.flaggedIds.length > 0
                ? "bg-rose-50/70 dark:bg-rose-950/50 border-rose-100 dark:border-rose-900/50 text-rose-950 dark:text-rose-200"
                : "bg-emerald-50/70 dark:bg-emerald-950/50 border-emerald-100 dark:border-emerald-900/50 text-emerald-950 dark:text-emerald-200 font-medium"
            )}
          >
            {data.flaggedIds.length > 0 ? (
              <span>⚠️ {data.flaggedIds.length} transaction(s) flagged for your review</span>
            ) : (
              <span>✓ All charges appear normal and verified</span>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-stone-400 dark:text-slate-400 py-3">
          Click &ldquo;Run Financial Audit&rdquo; to scan for unusual debits.
        </p>
      )}
    </Card>
  );
};
