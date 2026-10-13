import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Calendar, ChevronRight } from "lucide-react";
import { Card } from "../ui/Card";
import { formatCurrency, monthName } from "../../utils/formatters";
import { cn } from "../../utils/cn";
import type { Budget } from "../../types/budget";

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

  const percent = Math.min(activeBudget.percentUsed ?? 0, 100);
  const isOver = (activeBudget.percentUsed ?? 0) >= 100;
  const isWarning = (activeBudget.percentUsed ?? 0) >= 80 && !isOver;
  const remaining = (activeBudget.amount ?? 0) - (activeBudget.spent ?? 0);

  return (
    <Card className="flex flex-col gap-4 border border-stone-200/80 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Top Header: Category Info + Action Buttons */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold text-white shadow-xs"
            style={{ backgroundColor: category.color || "#4f46e5" }}
          >
            {(category.name || "Category").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 leading-tight">
              {category.name || "Category"}
            </h3>
            <p className="text-xs text-stone-500">
              {sortedBudgets.length} {sortedBudgets.length === 1 ? "month" : "months"} tracked
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
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
            title="Edit this month's budget"
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
        </div>

        {/* Description: 5000 of 10000 and remaining status */}
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-numeric font-semibold text-stone-900 text-base">
            {formatCurrency(activeBudget.spent ?? 0)}{" "}
            <span className="text-xs font-normal text-stone-500">
              of {formatCurrency(activeBudget.amount)}
            </span>
          </span>
          <span className="text-xs text-stone-500 font-numeric">
            {remaining >= 0 ? (
              <span className="text-stone-600 font-medium">
                {formatCurrency(remaining)} left
              </span>
            ) : (
              <span className="text-red-600 font-semibold">
                {formatCurrency(Math.abs(remaining))} over
              </span>
            )}
          </span>
        </div>

        {/* "that line": Progress Bar Line */}
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200/70">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              isOver
                ? "bg-red-500"
                : isWarning
                ? "bg-amber-500"
                : "bg-emerald-500"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Scrollable Month Breakdown: "when we scrool in that therr should be of diffrenrt month... like july 2026 and that line and 5000 of 10000" */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between text-xs text-stone-500">
          <span className="font-medium text-stone-700">Monthly History</span>
          <span className="text-[11px] text-stone-400">Scroll to view & select →</span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 pt-0.5 scrollbar-thin scrollbar-thumb-stone-200">
          {sortedBudgets.map((b) => {
            const bPercent = Math.min(b.percentUsed ?? 0, 100);
            const bOver = (b.percentUsed ?? 0) >= 100;
            const bWarn = (b.percentUsed ?? 0) >= 80 && !bOver;
            const isSelected = b.id === activeBudget.id;

            return (
              <button
                key={b.id}
                onClick={() => setSelectedId(b.id)}
                className={cn(
                  "flex min-w-[150px] max-w-[170px] shrink-0 flex-col gap-1.5 rounded-lg border p-2.5 text-left transition-all",
                  isSelected
                    ? "border-indigo-500 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-500"
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
                      bOver
                        ? "text-red-600"
                        : bWarn
                        ? "text-amber-600"
                        : "text-emerald-600"
                    )}
                  >
                    {Math.round(b.percentUsed ?? 0)}%
                  </span>
                </div>

                {/* Description: 5000 of 10000 */}
                <p className="font-numeric text-[11px] text-stone-600 leading-tight">
                  <span className="font-medium text-stone-900">
                    {formatCurrency(b.spent ?? 0)}
                  </span>{" "}
                  of {formatCurrency(b.amount)}
                </p>

                {/* "That line": Progress bar line */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      bOver
                        ? "bg-red-500"
                        : bWarn
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    )}
                    style={{ width: `${bPercent}%` }}
                  />
                </div>
              </button>
            );
          })}

          {/* Quick Add Month button inside the scroll strip */}
          <button
            onClick={() => onAddMonth(category.id)}
            className="flex min-w-[110px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-stone-300 p-2.5 text-stone-500 hover:border-emerald-500 hover:bg-emerald-50/40 hover:text-emerald-700 transition-all text-xs"
          >
            <Plus size={16} />
            <span className="font-medium">+ Add Month</span>
          </button>
        </div>
      </div>
    </Card>
  );
};
