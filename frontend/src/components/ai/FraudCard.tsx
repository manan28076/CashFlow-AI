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
    <Card className="flex flex-col gap-3 border border-stone-200/90 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-700">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              isClean ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            )}
          >
            {isClean ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
          </div>
          <h3 className="text-sm font-bold text-stone-900">Anomaly & Risk</h3>
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
          <p className="text-xs text-stone-600 leading-relaxed font-medium">
            {data.reason || (isClean ? "No anomalous or suspicious debits identified." : "Review flagged items.")}
          </p>
          <div
            className={cn(
              "rounded-xl border p-2.5 text-[11px]",
              data.flaggedIds.length > 0
                ? "bg-rose-50/70 border-rose-100 text-rose-950"
                : "bg-emerald-50/70 border-emerald-100 text-emerald-950 font-medium"
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
        <p className="text-xs text-stone-400 py-3">
          Click &ldquo;Run Financial Audit&rdquo; to scan for unusual debits.
        </p>
      )}
    </Card>
  );
};
