import { HeartPulse } from "lucide-react";
import { Card } from "../ui/Card";
import type { HealthResult } from "../../types/ai";
import { cn } from "../../utils/cn";

export const HealthCard = ({ data }: { data: HealthResult | null }) => {
  const score = data?.score ?? 0;
  const gradeColor =
    score >= 80
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : score >= 60
      ? "text-amber-700 bg-amber-50 border-amber-200"
      : "text-rose-700 bg-rose-50 border-rose-200";

  return (
    <Card className="flex flex-col gap-3 border border-stone-200/90 dark:border-blue-900/40 bg-white dark:bg-[#111c35] p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-700 dark:text-slate-300">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400">
            <HeartPulse size={18} />
          </div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-white">Health Score</h3>
        </div>
        {data && (
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-bold",
              gradeColor
            )}
          >
            Grade {data.grade}
          </span>
        )}
      </div>

      {data ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">
              {data.score}
            </span>
            <span className="text-xs font-semibold text-stone-400 dark:text-slate-400">/ 100</span>
          </div>

          {/* Mini progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-slate-800">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                score >= 80
                  ? "bg-emerald-500"
                  : score >= 60
                  ? "bg-amber-500"
                  : "bg-rose-500"
              )}
              style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
            />
          </div>

          <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed font-medium mt-0.5">
            {data.reason}
          </p>
          <div className="rounded-xl bg-stone-50 dark:bg-[#0c1426] border border-stone-100 dark:border-blue-900/40 p-2.5 text-[11px] text-stone-600 dark:text-slate-300">
            <span className="font-bold text-stone-800 dark:text-white">Recommendation: </span>
            {data.advice}
          </div>
        </div>
      ) : (
        <p className="text-xs text-stone-400 dark:text-slate-400 py-3">
          Click &ldquo;Run Financial Audit&rdquo; to calculate your live health score.
        </p>
      )}
    </Card>
  );
};
