import { ShieldAlert } from "lucide-react";
import { Card } from "../ui/Card";
import { cn } from "../../utils/cn";
import type { FraudResult } from "../../types/ai";

const riskColor: Record<string, string> = {
  LOW: "text-emerald-600 bg-emerald-500/15",
  MEDIUM: "text-amber-600 bg-amber-500/15",
  HIGH: "text-red-600 bg-red-500/15",
};

export const FraudCard = ({ data }: { data: FraudResult | null }) => {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-stone-600">
        <ShieldAlert size={18} className="text-red-600" />
        <h3 className="text-sm font-medium">Fraud Detection</h3>
      </div>
      {data ? (
        <>
          <span
            className={cn(
              "w-fit rounded-full px-2 py-0.5 text-xs font-medium",
              riskColor[data.risk] ?? riskColor.LOW
            )}
          >
            {data.risk} RISK
          </span>
          <p className="text-xs text-stone-500">{data.reason}</p>
          <p className="text-xs text-stone-500">
            {data.flaggedIds.length} transaction(s) flagged
          </p>
        </>
      ) : (
        <p className="text-sm text-stone-500">Run an analysis to check for anomalies.</p>
      )}
    </Card>
  );
};
