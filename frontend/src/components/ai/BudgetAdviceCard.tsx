import { Target } from "lucide-react";
import { Card } from "../ui/Card";
import type { BudgetAdviceResult } from "../../types/ai";

export const BudgetAdviceCard = ({ data }: { data: BudgetAdviceResult | null }) => {
  return (
    <Card className="flex flex-col gap-3 border border-stone-200/90 dark:border-blue-900/40 bg-white dark:bg-[#111c35] p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-700 dark:text-slate-300">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <Target size={18} />
          </div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-white">Budget Advice</h3>
        </div>
        {data?.status && (
          <span className="rounded-full bg-sky-50 dark:bg-sky-950/70 border border-sky-200/60 dark:border-sky-800/60 px-2.5 py-0.5 text-xs font-semibold text-sky-800 dark:text-sky-300">
            {data.status}
          </span>
        )}
      </div>

      {data ? (
        <div className="flex flex-col gap-2.5">
          <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed font-medium">
            {data.reason}
          </p>
          <div className="rounded-xl bg-sky-50/60 dark:bg-[#0c1426] border border-sky-100 dark:border-sky-900/40 p-2.5 text-[11px] text-sky-950 dark:text-sky-200">
            <span className="font-bold text-sky-900 dark:text-sky-300">Action: </span>
            {data.suggestion}
          </div>
        </div>
      ) : (
        <p className="text-xs text-stone-400 dark:text-slate-400 py-3">
          Click &ldquo;Run Financial Audit&rdquo; to evaluate your budget discipline.
        </p>
      )}
    </Card>
  );
};
