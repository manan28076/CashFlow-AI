import { useEffect, useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronLeft, ChevronRight, Calendar, PieChart as PieIcon } from "lucide-react";
import { Card } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { formatCurrency, monthName } from "../../utils/formatters";
import { dashboardService } from "../../services/dashboard.service";
import { cn } from "../../utils/cn";
import type {
  CategoryBreakdownItem,
  CategoryBreakdownResponse,
  AvailableMonth,
} from "../../types/dashboard";

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#06b6d4", // Cyan
  Shopping: "#ef4444", // Red
  Transfer: "#10b981", // Emerald
  Entertainment: "#f59e0b", // Amber
  Bills: "#8b5cf6", // Purple
  Healthcare: "#ec4899", // Pink
  Travel: "#f97316", // Orange
  Education: "#6366f1", // Indigo
  Investment: "#14b8a6", // Teal
  Salary: "#22c55e", // Green
  Other: "#64748b", // Slate
};

const FALLBACK_COLORS = [
  "#06b6d4",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#6366f1",
  "#14b8a6",
  "#64748b",
];

interface ExpenseByCategoryChartProps {
  initialData?: CategoryBreakdownResponse | CategoryBreakdownItem[] | null;
  isLoading: boolean;
}

export const ExpenseByCategoryChart = ({
  initialData,
  isLoading,
}: ExpenseByCategoryChartProps) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState<number | "all">(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [breakdown, setBreakdown] = useState<CategoryBreakdownResponse | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  // Sync initialData when parent dashboard loads
  useEffect(() => {
    if (initialData) {
      if ("items" in initialData) {
        setBreakdown(initialData);
        if (initialData.selectedMonth) {
          setSelectedMonth(initialData.selectedMonth);
        }
        if (initialData.selectedYear) {
          setSelectedYear(initialData.selectedYear);
        }
      } else if (Array.isArray(initialData)) {
        // Fallback for array response
        const total = initialData.reduce((acc, i) => acc + (i.amount || 0), 0);
        setBreakdown({
          items: initialData,
          total,
          selectedMonth: currentMonth,
          selectedYear: currentYear,
          availableMonths: [{ year: currentYear, month: currentMonth }],
        });
      }
    }
  }, [initialData, currentMonth, currentYear]);

  // Fetch breakdown when user changes month/year
  const fetchMonthBreakdown = async (
    targetMonth: number | "all",
    targetYear?: number
  ) => {
    setIsFetching(true);
    try {
      const res = await dashboardService.getCategoryBreakdown(
        targetMonth,
        targetMonth === "all" ? undefined : targetYear
      );
      if (res) {
        setBreakdown(res);
        setSelectedMonth(targetMonth);
        if (targetYear) setSelectedYear(targetYear);
      }
    } catch {
      // Keep previous data if error
    } finally {
      setIsFetching(false);
    }
  };

  const availableMonths = useMemo<AvailableMonth[]>(() => {
    if (breakdown?.availableMonths && breakdown.availableMonths.length > 0) {
      return breakdown.availableMonths;
    }
    return [{ year: currentYear, month: currentMonth }];
  }, [breakdown, currentMonth, currentYear]);

  const items = breakdown?.items || [];
  const totalAmount = breakdown?.total || 0;

  // Active month index for previous/next arrows
  const activeMonthIndex = availableMonths.findIndex(
    (m) => m.month === selectedMonth && m.year === selectedYear
  );

  const handlePrevMonth = () => {
    if (selectedMonth === "all") {
      const first = availableMonths[0];
      if (first) fetchMonthBreakdown(first.month, first.year);
    } else if (activeMonthIndex < availableMonths.length - 1) {
      const nextOlder = availableMonths[activeMonthIndex + 1];
      if (nextOlder) fetchMonthBreakdown(nextOlder.month, nextOlder.year);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === "all") {
      const first = availableMonths[0];
      if (first) fetchMonthBreakdown(first.month, first.year);
    } else if (activeMonthIndex > 0) {
      const nextNewer = availableMonths[activeMonthIndex - 1];
      if (nextNewer) fetchMonthBreakdown(nextNewer.month, nextNewer.year);
    }
  };

  return (
    <Card className="flex flex-col gap-3.5">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-stone-900">
              Expense by Category
            </h3>
            {isFetching && (
              <span className="inline-block h-2 w-2 animate-ping rounded-full bg-indigo-500" />
            )}
          </div>
          <p className="text-xs text-stone-500">
            {selectedMonth === "all"
              ? "All-time total expenses across all categories"
              : `Only expenses made in ${monthName(selectedMonth as number)} ${selectedYear}`}
          </p>
        </div>

        {/* Prev / Next Month Arrow Buttons */}
        <div className="flex items-center gap-1 self-start sm:self-auto">
          <button
            onClick={handlePrevMonth}
            disabled={
              selectedMonth === "all" ||
              activeMonthIndex >= availableMonths.length - 1
            }
            className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50 disabled:opacity-40"
            title="Previous month"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={handleNextMonth}
            disabled={selectedMonth === "all" || activeMonthIndex <= 0}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50 disabled:opacity-40"
            title="Next month"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Scrollable Month Pills Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin scrollbar-thumb-stone-200">
        <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Calendar size={12} />
          Month:
        </span>

        {/* Available Months Buttons */}
        {availableMonths.map((m) => {
          const isActive =
            selectedMonth === m.month && selectedYear === m.year;
          const isNow = m.month === currentMonth && m.year === currentYear;

          return (
            <button
              key={`${m.year}-${m.month}`}
              onClick={() => fetchMonthBreakdown(m.month, m.year)}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all shrink-0",
                isActive
                  ? "bg-indigo-600 text-white shadow-xs font-semibold ring-1 ring-indigo-600"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              )}
            >
              <span>
                {monthName(m.month)} {m.year}
              </span>
              {isNow && (
                <span
                  className={cn(
                    "rounded-full px-1 py-0.2 text-[9px] font-bold uppercase",
                    isActive
                      ? "bg-indigo-400/50 text-white"
                      : "bg-stone-200 text-stone-600"
                  )}
                >
                  Now
                </span>
              )}
            </button>
          );
        })}

        {/* All-time option */}
        <button
          onClick={() => fetchMonthBreakdown("all")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-all shrink-0",
            selectedMonth === "all"
              ? "bg-stone-900 text-white shadow-xs font-semibold ring-1 ring-stone-900"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          )}
        >
          All Time
        </button>
      </div>

      {/* Chart Section */}
      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-400">
            <PieIcon size={20} />
          </div>
          <p className="text-sm font-medium text-stone-700">
            No expenses in {selectedMonth === "all" ? "this period" : `${monthName(selectedMonth as number)} ${selectedYear}`}
          </p>
          <p className="mt-0.5 text-xs text-stone-400">
            Scroll or select another month above to view expense trends.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Donut Chart with Centered Total */}
          <div className="relative h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={items}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={92}
                  paddingAngle={2}
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {items.map((entry, index) => {
                    const color =
                      CATEGORY_COLORS[entry.category] ||
                      FALLBACK_COLORS[index % FALLBACK_COLORS.length];
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    "Amount",
                  ]}
                  contentStyle={{
                    background: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Absolute Centered Total inside Donut */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">
                Total Spent
              </span>
              <span className="font-numeric text-lg font-bold text-stone-900 leading-tight">
                {formatCurrency(totalAmount)}
              </span>
              <span className="text-[10px] text-stone-500 font-medium">
                {selectedMonth === "all"
                  ? "All Time"
                  : `${monthName(selectedMonth as number).slice(0, 3)} ${selectedYear}`}
              </span>
            </div>
          </div>

          {/* Interactive Category Chips Breakdown */}
          <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-2">
            {items.map((item, index) => {
              const color =
                CATEGORY_COLORS[item.category] ||
                FALLBACK_COLORS[index % FALLBACK_COLORS.length];
              const percent =
                totalAmount > 0
                  ? Math.round((item.amount / totalAmount) * 100)
                  : 0;

              return (
                <div
                  key={item.category}
                  className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50/70 px-2.5 py-1.5 text-xs hover:bg-stone-100/80 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate font-medium text-stone-800">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 font-numeric">
                    <span className="font-semibold text-stone-900">
                      {formatCurrency(item.amount)}
                    </span>
                    <span className="text-[10px] text-stone-500 font-medium">
                      ({percent}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};
