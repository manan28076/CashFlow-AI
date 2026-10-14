import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Calendar, AlertCircle } from "lucide-react";
import { Card } from "../ui/Card";
import { formatCurrency, monthName } from "../../utils/formatters";
import { cn } from "../../utils/cn";
import type { Budget } from "../../types/budget";

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#06b6d4",
  Shopping: "#ef4444",
  Transfer: "#10b981",
  Entertainment: "#f59e0b",
  Bills: "#8b5cf6",
  Healthcare: "#ec4899",
  Travel: "#f97316",
  Education: "#6366f1",
  Investment: "#14b8a6",
  Other: "#64748b",
};

interface BudgetCardProps {
  category: {
    id: string;
    name: string;
    color?: string | null;
    icon?: string | null;
  };
  budgets: Budget[];
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => void;
  onAddMonth: (categoryId: string) => void;
  globalMonthFilter?: number | null;
  globalYearFilter?: number | null;
}

export const BudgetCard = ({
  category,
  budgets,
  onEdit,
  onDelete,
  onAddMonth,
  globalMonthFilter,
  globalYearFilter,
}: BudgetCardProps) => {
  // Sort budgets by year descending, then month descending
  const sortedBudgets = [...budgets].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Determine initial selected budget
  const targetBudget =
    (globalMonthFilter &&
      globalYearFilter &&
      sortedBudgets.find(
        (b) => b.month === globalMonthFilter && b.year === globalYearFilter
      )) ||
    sortedBudgets.find(
      (b) => b.month === currentMonth && b.year === currentYear
    ) ||
    sortedBudgets[0];

  const [selectedId, setSelectedId] = useState<string>(targetBudget?.id ?? "");

  // Keep selectedId in sync when user clicks a top Focus Month pill or data reloads
  useEffect(() => {
    if (globalMonthFilter && globalYearFilter) {
      const match = sortedBudgets.find(
        (b) => b.month === globalMonthFilter && b.year === globalYearFilter
      );
      if (match) {
        setSelectedId(match.id);
        return;
      }
    }
    const currentMatch = sortedBudgets.find(
      (b) => b.month === currentMonth && b.year === currentYear
    );
    if (currentMatch) {
      setSelectedId(currentMatch.id);
    } else if (sortedBudgets[0]) {
      setSelectedId(sortedBudgets[0].id);
    }
  }, [globalMonthFilter, globalYearFilter, budgets]);

  const activeBudget =
    sortedBudgets.find((b) => b.id === selectedId) || sortedBudgets[0];

  if (!activeBudget) return null;

  const isConfigured = (activeBudget.amount ?? 0) > 0;
  const percent = isConfigured
    ? Math.min(activeBudget.percentUsed ?? 0, 100)
    : (activeBudget.spent ?? 0) > 0
    ? 100
    : 0;

  const isOver = isConfigured
    ? (activeBudget.percentUsed ?? 0) >= 100
    : (activeBudget.spent ?? 0) > 0;
  const isWarning = isConfigured && (activeBudget.percentUsed ?? 0) >= 80 && !isOver;
  const remaining = (activeBudget.amount ?? 0) - (activeBudget.spent ?? 0);

  const categoryColor =
    CATEGORY_COLORS[category.name] || category.color || "#ea580c";

  const isCurrentMonth =
    activeBudget.month === currentMonth && activeBudget.year === currentYear;

  return (
    <Card className="group relative flex flex-col justify-between gap-4 overflow-hidden border border-stone-200/90 dark:border-blue-900/40 bg-white dark:bg-[#111c35] p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-stone-300 dark:hover:border-blue-700/50 hover:shadow-lg">
      {/* Top Category Accent Line */}
      <div
        className="absolute left-0 right-0 top-0 h-1.5 opacity-90 transition-all duration-300 group-hover:h-2"
        style={{ backgroundColor: categoryColor }}
      />

      {/* Top Header: Category Info + Action Buttons */}
      <div className="flex items-start justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white shadow-xs transition-transform duration-300 group-hover:scale-105"
            style={{
              backgroundColor: categoryColor,
              boxShadow: `0 4px 12px ${categoryColor}33`,
            }}
          >
            {(category.name || "Category").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="truncate font-bold text-stone-900 dark:text-white leading-tight transition-colors group-hover:text-stone-950 dark:group-hover:text-blue-100">
                {category.name || "Category"}
              </h3>
              {!isConfigured && (
                <span className="rounded-full bg-stone-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-stone-500 dark:text-slate-400">
                  Unset (₹0)
                </span>
              )}
            </div>
            <p className="truncate text-xs font-medium text-stone-500 dark:text-slate-400">
              {isConfigured
                ? `Limit: ${formatCurrency(activeBudget.amount)} / mo`
                : "No limit set yet"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isConfigured ? (
            <button
              onClick={() => onAddMonth(category.id)}
              title="Set budget for another month"
              className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-2xs transition-all hover:scale-105 hover:bg-emerald-100 active:scale-95"
            >
              <Plus size={13} />
              <span>Add Month</span>
            </button>
          ) : (
            <button
              onClick={() => onEdit(activeBudget)}
              className="flex items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700 shadow-2xs transition-all hover:scale-105 hover:bg-orange-100 active:scale-95"
            >
              <Plus size={13} />
              <span>Set Limit</span>
            </button>
          )}          <button
            onClick={() => onEdit(activeBudget)}
            className="rounded-lg p-1.5 text-stone-400 dark:text-slate-400 transition-all hover:bg-stone-100 dark:hover:bg-slate-800 hover:text-stone-700 dark:hover:text-slate-200 active:scale-90"
            title={isConfigured ? "Edit budget limit" : "Set budget limit"}
            aria-label="Edit budget"
          >
            <Pencil size={14} />
          </button>

          <button
            onClick={() => onDelete(activeBudget.id)}
            className="rounded-lg p-1.5 text-stone-400 dark:text-slate-400 transition-all hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-300 active:scale-90"
            title={isConfigured ? "Delete / Reset budget limit" : "Reset budget limit"}
            aria-label="Delete budget"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Active Month Spotlight Box */}
      <div className="flex flex-col gap-3 rounded-xl border border-stone-200/70 dark:border-blue-900/40 bg-gradient-to-b from-stone-50/90 to-stone-50/40 dark:from-[#0c1426] dark:to-[#0f172a] p-4 shadow-2xs transition-all duration-300 group-hover:border-stone-300/80 dark:group-hover:border-blue-800/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-slate-300">
            <Calendar size={13} className="text-stone-400 dark:text-slate-400" />
            <span>
              {monthName(activeBudget.month)} {activeBudget.year}
            </span>
            {isCurrentMonth && (
              <span className="rounded-full bg-orange-100 dark:bg-orange-950/70 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-orange-800 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/60">
                Current
              </span>
            )}
          </div>

          <div>
            {isConfigured ? (
              <span
                className={cn(
                  "font-numeric text-xs font-bold px-2.5 py-0.5 rounded-full shadow-2xs",
                  isOver
                    ? "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300 dark:border dark:border-red-800/60"
                    : isWarning
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 dark:border dark:border-amber-800/60"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border dark:border-emerald-800/60"
                )}
              >
                {Math.round(activeBudget.percentUsed ?? 0)}% used
              </span>
            ) : (activeBudget.spent ?? 0) > 0 ? (
              <span className="font-numeric text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100/90 text-amber-900 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/60 shadow-2xs">
                Unbudgeted
              </span>
            ) : (
              <span className="font-numeric text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-stone-200/60 text-stone-500 dark:bg-slate-800 dark:text-slate-400">
                ₹0 limit
              </span>
            )}
          </div>
        </div>

        {/* Spent Amount & Runway Balance */}
        <div className="flex items-end justify-between gap-2">
          <div className="flex flex-col">
            <span className="font-numeric text-xl font-black text-stone-900 dark:text-white tracking-tight leading-none">
              {formatCurrency(activeBudget.spent ?? 0)}
            </span>
            <span className="mt-1 text-xs font-medium text-stone-500 dark:text-slate-400">
              {isConfigured
                ? `budgeted: ${formatCurrency(activeBudget.amount)}`
                : "spent (no limit set)"}
            </span>
          </div>

          <div className="shrink-0 text-right">
            {isConfigured ? (
              remaining >= 0 ? (
                <span className="font-numeric text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/70 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800/60 shadow-2xs">
                  {formatCurrency(remaining)} left
                </span>
              ) : (
                <span className="font-numeric text-xs font-bold text-red-700 bg-red-50 dark:bg-red-950/70 dark:text-red-300 px-2.5 py-1 rounded-lg border border-red-100 dark:border-red-800/60 shadow-2xs">
                  {formatCurrency(Math.abs(remaining))} over
                </span>
              )
            ) : (activeBudget.spent ?? 0) > 0 ? (
              <button
                onClick={() => onEdit(activeBudget)}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/60 dark:text-orange-300 dark:hover:bg-orange-900/70 px-2.5 py-1 rounded-lg transition-all shadow-2xs"
              >
                Set limit to track →
              </button>
            ) : (
              <span className="text-[11px] font-medium text-stone-400 dark:text-slate-400">No expenses</span>
            )}
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200/80 dark:bg-slate-800 p-0.5 shadow-inner">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out shadow-xs",
              isConfigured
                ? isOver
                ? "bg-red-500"
                : isWarning
                ? "bg-amber-500"
                : "bg-emerald-500"
                : (activeBudget.spent ?? 0) > 0
                ? "bg-amber-400"
                : "bg-stone-300 dark:bg-slate-700"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Monthly History Scroll Strip */}
      <div className="flex flex-col gap-2 pt-0.5">
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-slate-400">
          <span className="font-bold text-stone-700 dark:text-slate-300">Monthly History</span>
          <span className="text-[11px] font-medium text-stone-400 dark:text-slate-400">Scroll to view & select →</span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-stone-200 dark:scrollbar-thumb-slate-800">
          {sortedBudgets.map((b) => {
            const bConfigured = (b.amount ?? 0) > 0;
            const bPercent = bConfigured
              ? Math.min(b.percentUsed ?? 0, 100)
              : (b.spent ?? 0) > 0
              ? 100
              : 0;
            const bOver = bConfigured
              ? (b.percentUsed ?? 0) >= 100
              : (b.spent ?? 0) > 0;
            const bWarn = bConfigured && (b.percentUsed ?? 0) >= 80 && !bOver;
            const isSelected = b.id === activeBudget.id;

            return (
              <button
                key={b.id}
                onClick={() => setSelectedId(b.id)}
                className={cn(
                  "flex min-w-[155px] max-w-[175px] shrink-0 flex-col gap-1.5 rounded-xl border p-2.5 text-left transition-all duration-200 cursor-pointer select-none",
                  isSelected
                    ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/40 shadow-xs ring-1.5 ring-orange-400 scale-[1.02]"
                    : "border-stone-200 dark:border-blue-900/40 bg-white dark:bg-[#0c1426] hover:border-stone-300 dark:hover:border-blue-700/60 hover:bg-stone-50/70 dark:hover:bg-[#111c35] hover:scale-[1.01]"
                )}
              >
                {/* Month Name & Limit/Status Badge with distinct spacing */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span
                    className={cn(
                      "font-bold truncate",
                      isSelected ? "text-orange-950 dark:text-orange-300" : "text-stone-800 dark:text-slate-200"
                    )}
                  >
                    {monthName(b.month).slice(0, 3)} {b.year}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-extrabold font-numeric shrink-0 px-1.5 py-0.2 rounded-full",
                      bConfigured
                        ? bOver
                          ? "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300"
                          : bWarn
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"
                        : (b.spent ?? 0) > 0
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                        : "bg-stone-100 text-stone-500 dark:bg-slate-800 dark:text-slate-400"
                    )}
                  >
                    {bConfigured ? `${Math.round(b.percentUsed ?? 0)}%` : "₹0 limit"}
                  </span>
                </div>

                {/* Amount spent */}
                <p className="font-numeric text-[11px] text-stone-600 dark:text-slate-400 leading-tight">
                  <span className="font-bold text-stone-900 dark:text-white">
                    {formatCurrency(b.spent ?? 0)}
                  </span>{" "}
                  {bConfigured ? `of ${formatCurrency(b.amount)}` : "spent"}
                </p>

                {/* Micro Progress Bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-slate-800">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      bConfigured
                        ? bOver
                          ? "bg-red-500"
                          : bWarn
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                        : (b.spent ?? 0) > 0
                        ? "bg-amber-400"
                        : "bg-stone-300 dark:bg-slate-700"
                    )}
                    style={{ width: `${bPercent}%` }}
                  />
                </div>
              </button>
            );
          })}

          {/* Quick Add / Change Month button */}
          <button
            onClick={() => onAddMonth(category.id)}
            className="flex min-w-[110px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-stone-300 dark:border-blue-900/60 p-2.5 text-stone-500 dark:text-slate-400 hover:border-orange-500 dark:hover:border-blue-500 hover:bg-orange-50/40 dark:hover:bg-blue-950/40 hover:text-orange-700 dark:hover:text-blue-300 transition-all text-xs cursor-pointer hover:scale-[1.02] active:scale-95"
          >
            <Plus size={16} />
            <span className="font-bold text-[11px]">{isConfigured ? "+ Add Month" : "+ Set Limit"}</span>
          </button>
        </div>
      </div>
    </Card>
  );
};
