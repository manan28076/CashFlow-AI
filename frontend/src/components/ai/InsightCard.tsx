import { Lightbulb } from "lucide-react";
import { Card } from "../ui/Card";
import type { InsightResult } from "../../types/ai";

export const InsightCard = ({ data }: { data: InsightResult | null }) => {
  return (
    <Card className="flex flex-col gap-3 border border-stone-200/90 dark:border-blue-900/40 bg-white dark:bg-[#111c35] p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-700 dark:text-slate-300">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Lightbulb size={18} />
          </div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-white">Spending Patterns</h3>
        </div>
        {data?.topCategory && (
          <span className="rounded-full bg-amber-50 dark:bg-amber-950/70 border border-amber-200/60 dark:border-amber-800/60 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
            Top: {data.topCategory}
          </span>
        )}
      </div>

      {data ? (
        <div className="flex flex-col gap-2.5">
          <p className="text-sm font-semibold text-stone-800 dark:text-slate-200 leading-snug">
            {data.summary}
          </p>
          <div className="rounded-xl bg-amber-50/60 dark:bg-[#0c1426] border border-amber-100 dark:border-amber-900/40 p-2.5 text-[11px] text-amber-950 dark:text-amber-200">
            <span className="font-bold text-amber-900 dark:text-amber-300">Optimization: </span>
            {data.recommendation}
          </div>
        </div>
      ) : (
        <p className="text-xs text-stone-400 dark:text-slate-400 py-3">
          Click &ldquo;Run Financial Audit&rdquo; to analyze your spending trends.
        </p>
      )}
    </Card>
  );
};
