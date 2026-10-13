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
    CATEGORY_COLORS[category.name] || category.color || "#6366f1";

  return (
    <Card className="flex flex-col gap-3.5 border border-stone-200/90 bg-white shadow-xs hover:shadow-md transition-shadow">
      {/* Top Header: Category Info + Action Buttons */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white shadow-xs shrink-0"
            style={{ backgroundColor: categoryColor }}
          >
            {(category.name || "Category").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-stone-900 leading-tight">
                {category.name || "Category"}
              </h3>
              {!isConfigured && (
                <span className="rounded bg-stone-100 px-1.5 py-0.2 text-[10px] font-medium text-stone-500">
                  Unset (₹0)
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500">
              {isConfigured
                ? `Limit: ${formatCurrency(activeBudget.amount)} / month`
                : "No limit set yet"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isConfigured ? (
            <>
              <button
                onClick={() => onAddMonth(category.id)}
                title="Set budget for another month"
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                <Plus size={13} />
                Add Month
              </button>
              <button
                onClick={() => onEdit(activeBudget)}
                className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                title="Edit this month's budget limit"
                aria-label="Edit budget"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => onDelete(activeBudget.id)}
                className="rounded-md p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Delete this month's budget"
                aria-label="Delete budget"
              >
                <Trash2 size={15} />
              </button>
            </>
          ) : (
            <button
              onClick={() => onEdit(activeBudget)}
              className="flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs"
            >
              <Plus size={13} />
              Set Limit
            </button>
          )}
        </div>
      </div>

      {/* Active Month Spotlight */}
      <div className="rounded-xl bg-stone-50/80 border border-stone-100 p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
            <Calendar size={13} className="text-stone-400" />
            <span>
              {monthName(activeBudget.month)} {activeBudget.year}
            </span>
            {activeBudget.month === currentMonth &&
              activeBudget.year === currentYear && (
                <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                  Current
                </span>
              )}
          </div>
          {isConfigured ? (
            <span
              className={cn(
                "font-numeric text-xs font-bold px-2 py-0.5 rounded-full",
                isOver
                  ? "bg-red-100 text-red-700"
                  : isWarning
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              )}
            >
              {Math.round(activeBudget.percentUsed ?? 0)}%
            </span>
          ) : (activeBudget.spent ?? 0) > 0 ? (
            <span className="font-numeric text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              Unbudgeted
            </span>
          ) : (
            <span className="font-numeric text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-200/70 text-stone-600">
              ₹0 limit
            </span>
          )}
        </div>

        {/* Description: 5000 of 10000 and status */}
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-numeric font-semibold text-stone-900 text-base">
            {formatCurrency(activeBudget.spent ?? 0)}{" "}
            <span className="text-xs font-normal text-stone-500">
              {isConfigured
                ? `of ${formatCurrency(activeBudget.amount)}`
                : "spent (no limit set)"}
            </span>
          </span>

          <span className="text-xs font-numeric">
            {isConfigured ? (
              remaining >= 0 ? (
                <span className="text-stone-600 font-medium">
                  {formatCurrency(remaining)} left
                </span>
              ) : (
                <span className="text-red-600 font-semibold">
                  {formatCurrency(Math.abs(remaining))} over
                </span>
              )
            ) : (activeBudget.spent ?? 0) > 0 ? (
              <button
                onClick={() => onEdit(activeBudget)}
                className="text-indigo-600 font-semibold text-[11px] underline hover:text-indigo-800"
              >
                Set limit to track
              </button>
            ) : (
              <span className="text-stone-400 text-[11px]">No activity</span>
            )}
          </span>
        </div>

        {/* Progress Bar Line */}
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200/70">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              isConfigured
                ? isOver
                  ? "bg-red-500"
                  : isWarning
                  ? "bg-amber-500"
                  : "bg-emerald-500"
                : (activeBudget.spent ?? 0) > 0
                ? "bg-amber-400"
                : "bg-stone-300"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Monthly History Scroll Strip */}
      <div className="flex flex-col gap-1.5 pt-0.5">
        <div className="flex items-center justify-between text-xs text-stone-500">
          <span className="font-medium text-stone-700">Monthly History</span>
          <span className="text-[11px] text-stone-400">Scroll to view & select →</span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-stone-200">
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
                  "flex min-w-[145px] max-w-[165px] shrink-0 flex-col gap-1 rounded-lg border p-2 text-left transition-all",
                  isSelected
                    ? "border-indigo-500 bg-indigo-50/40 shadow-2xs ring-1 ring-indigo-500"
                    : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50"
                )}
              >
                {/* Month Name & Year */}
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={cn(
                      "font-semibold truncate",
                      isSelected ? "text-indigo-950" : "text-stone-800"
                    )}
                  >
                    {monthName(b.month)} {b.year}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold font-numeric",
                      bConfigured
                        ? bOver
                          ? "text-red-600"
                          : bWarn
                          ? "text-amber-600"
                          : "text-emerald-600"
                        : (b.spent ?? 0) > 0
                        ? "text-amber-600"
                        : "text-stone-400"
                    )}
                  >
                    {bConfigured ? `${Math.round(b.percentUsed ?? 0)}%` : "₹0 limit"}
                  </span>
                </div>

                {/* Description: 5000 of 10000 */}
                <p className="font-numeric text-[11px] text-stone-600 leading-tight">
                  <span className="font-medium text-stone-900">
                    {formatCurrency(b.spent ?? 0)}
                  </span>{" "}
                  {bConfigured ? `of ${formatCurrency(b.amount)}` : "spent"}
                </p>

                {/* Progress bar line */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      bConfigured
                        ? bOver
                          ? "bg-red-500"
                          : bWarn
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                        : (b.spent ?? 0) > 0
                        ? "bg-amber-400"
                        : "bg-stone-300"
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
            className="flex min-w-[105px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-stone-300 p-2 text-stone-500 hover:border-indigo-500 hover:bg-indigo-50/40 hover:text-indigo-700 transition-all text-xs"
          >
            <Plus size={15} />
            <span className="font-medium">{isConfigured ? "+ Add Month" : "+ Set Limit"}</span>
          </button>
        </div>
      </div>
    </Card>
  );
};
