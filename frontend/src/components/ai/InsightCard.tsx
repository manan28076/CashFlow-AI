import { Lightbulb } from "lucide-react";
import { Card } from "../ui/Card";
import type { InsightResult } from "../../types/ai";

export const InsightCard = ({ data }: { data: InsightResult | null }) => {
  return (
    <Card className="flex flex-col gap-3 border border-stone-200/90 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Lightbulb size={18} />
          </div>
          <h3 className="text-sm font-bold text-stone-900">Spending Patterns</h3>
        </div>
        {data?.topCategory && (
          <span className="rounded-full bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            Top: {data.topCategory}
          </span>
        )}
      </div>

      {data ? (
        <div className="flex flex-col gap-2.5">
          <p className="text-sm font-semibold text-stone-800 leading-snug">
            {data.summary}
          </p>
          <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-2.5 text-[11px] text-amber-950">
            <span className="font-bold text-amber-900">Optimization: </span>
            {data.recommendation}
          </div>
        </div>
      ) : (
        <p className="text-xs text-stone-400 py-3">
          Click &ldquo;Run Financial Audit&rdquo; to analyze your spending trends.
        </p>
      )}
    </Card>
  );
};
