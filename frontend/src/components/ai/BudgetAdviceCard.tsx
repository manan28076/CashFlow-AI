import { Target } from "lucide-react";
import { Card } from "../ui/Card";
import type { BudgetAdviceResult } from "../../types/ai";

export const BudgetAdviceCard = ({ data }: { data: BudgetAdviceResult | null }) => {
  return (
    <Card className="flex flex-col gap-3 border border-stone-200/90 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <Target size={18} />
          </div>
          <h3 className="text-sm font-bold text-stone-900">Budget Advice</h3>
        </div>
        {data?.status && (
          <span className="rounded-full bg-sky-50 border border-sky-200/60 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
            {data.status}
          </span>
        )}
      </div>

      {data ? (
        <div className="flex flex-col gap-2.5">
          <p className="text-xs text-stone-600 leading-relaxed font-medium">
            {data.reason}
          </p>
          <div className="rounded-xl bg-sky-50/60 border border-sky-100 p-2.5 text-[11px] text-sky-950">
            <span className="font-bold text-sky-900">Action: </span>
            {data.suggestion}
          </div>
        </div>
      ) : (
        <p className="text-xs text-stone-400 py-3">
          Click &ldquo;Run Financial Audit&rdquo; to evaluate your budget discipline.
        </p>
      )}
    </Card>
  );
};
