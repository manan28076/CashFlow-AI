import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Activity, Sparkles } from "lucide-react";
import { Card } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { formatCurrency, formatCompactCurrency } from "../../utils/formatters";
import type { MonthlyTrendItem } from "../../types/dashboard";

interface SpendingTrendChartProps {
  data: MonthlyTrendItem[];
  isLoading: boolean;
}

const CustomSpendingTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  const value = Number(payload[0]?.value || 0);

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-900/95 p-3.5 shadow-2xl backdrop-blur-md text-white min-w-[170px] animate-in fade-in duration-200">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block border-b border-stone-800 pb-2 mb-2">
        {label}
      </span>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-stone-300">Outflow</span>
        <span className="font-numeric font-bold text-orange-400">
          {formatCurrency(value)}
        </span>
      </div>
    </div>
  );
};

export const SpendingTrendChart = ({ data, isLoading }: SpendingTrendChartProps) => {
  const avgMonthlySpend =
    data.length > 0
      ? Math.round(data.reduce((acc, d) => acc + (d.expense || 0), 0) / data.length)
      : 0;

  return (
    <Card className="flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/90 dark:border-blue-900/40 bg-white dark:bg-[#0f172a] p-5 shadow-xs hover:shadow-md transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 dark:border-slate-800/80 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 shadow-2xs">
            <Activity size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-white">
              Spending Velocity Trend
            </h3>
            <p className="text-xs text-stone-500 dark:text-slate-400">
              Historical timeline of your monthly expenses
            </p>
          </div>
        </div>

        {avgMonthlySpend > 0 && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50/80 dark:bg-orange-950/70 px-3 py-1 text-xs font-semibold text-orange-800 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/60 shadow-2xs self-start sm:self-center">
            <Sparkles size={12} className="text-orange-600 dark:text-orange-400" />
            <span>Avg: <strong>{formatCurrency(avgMonthlySpend)}</strong>/mo</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : data.length === 0 ? (
        <EmptyState title="No spending trend yet" />
      ) : (
        <div className="w-full">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="spendingAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ea580c" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="4 4"
                stroke="#f1f5f9"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                dy={6}
              />

              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCompactCurrency}
                dx={-4}
              />

              <Tooltip
                content={<CustomSpendingTooltip />}
                cursor={{ stroke: "#ea580c", strokeWidth: 1.5, strokeDasharray: "4 4" }}
              />

              <Area
                type="monotone"
                dataKey="expense"
                stroke="#ea580c"
                strokeWidth={3}
                fill="url(#spendingAreaGrad)"
                activeDot={{
                  r: 6,
                  fill: "#ea580c",
                  stroke: "#ffffff",
                  strokeWidth: 3,
                  className: "filter drop-shadow-md",
                }}
                dot={{
                  r: 3.5,
                  fill: "#ea580c",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};
