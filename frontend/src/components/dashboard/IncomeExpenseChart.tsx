import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { BarChart3, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { Card } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { formatCurrency, formatCompactCurrency } from "../../utils/formatters";
import type { MonthlyTrendItem } from "../../types/dashboard";

interface IncomeExpenseChartProps {
  data: MonthlyTrendItem[];
  isLoading: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  const income = Number(payload.find((p) => p.dataKey === "income")?.value || 0);
  const expense = Number(payload.find((p) => p.dataKey === "expense")?.value || 0);
  const net = income - expense;
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-900/95 p-4 shadow-2xl backdrop-blur-md text-white min-w-[210px] animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-stone-800 pb-2.5 mb-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          {label}
        </span>
        {income > 0 && (
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              savingsRate >= 0
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
            }`}
          >
            {savingsRate >= 0 ? `${savingsRate}% saved` : `${Math.abs(savingsRate)}% deficit`}
          </span>
        )}
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
            <span className="text-stone-300">Income</span>
          </div>
          <span className="font-numeric font-bold text-emerald-400">
            {formatCurrency(income)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-xs shadow-rose-500/50" />
            <span className="text-stone-300">Expense</span>
          </div>
          <span className="font-numeric font-bold text-rose-400">
            {formatCurrency(expense)}
          </span>
        </div>

        <div className="border-t border-stone-800/80 pt-2 flex items-center justify-between gap-4">
          <span className="text-stone-400 font-medium">Net Savings</span>
          <span
            className={`font-numeric font-bold ${
              net >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {net >= 0 ? `+${formatCurrency(net)}` : `-${formatCurrency(Math.abs(net))}`}
          </span>
        </div>
      </div>
    </div>
  );
};

export const IncomeExpenseChart = ({ data, isLoading }: IncomeExpenseChartProps) => {
  const [activeLegend, setActiveLegend] = useState<"all" | "income" | "expense">("all");

  const totalIncome = data.reduce((acc, d) => acc + (d.income || 0), 0);
  const totalExpense = data.reduce((acc, d) => acc + (d.expense || 0), 0);

  return (
    <Card className="flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs hover:shadow-md transition-all duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 shadow-2xs">
            <BarChart3 size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Monthly Income vs Expense
            </h3>
            <p className="text-xs text-stone-500">
              Cash inflow compared to monthly outflows
            </p>
          </div>
        </div>

        {/* Interactive Filter Pills */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setActiveLegend(activeLegend === "income" ? "all" : "income")}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeLegend === "income" || activeLegend === "all"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs hover:bg-emerald-100"
                : "bg-stone-50 text-stone-400 border border-stone-200/40 opacity-60"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/40" />
            <span>Income</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLegend(activeLegend === "expense" ? "all" : "expense")}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeLegend === "expense" || activeLegend === "all"
                ? "bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs hover:bg-rose-100"
                : "bg-stone-50 text-stone-400 border border-stone-200/40 opacity-60"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-500 shadow-xs shadow-rose-500/40" />
            <span>Expense</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : data.length === 0 ? (
        <EmptyState title="No trend data yet" />
      ) : (
        <div className="w-full">
          <ResponsiveContainer width="100%" height={270}>
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              barGap={6}
            >
              <defs>
                {/* Income Gradient */}
                <linearGradient id="incomeBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.85} />
                </linearGradient>

                {/* Expense Gradient */}
                <linearGradient id="expenseBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity={0.85} />
                </linearGradient>

                {/* Hover Glow Filters */}
                <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.18" />
                </filter>
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
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(241, 245, 249, 0.6)", radius: 8 }}
              />

              {(activeLegend === "all" || activeLegend === "income") && (
                <Bar
                  dataKey="income"
                  fill="url(#incomeBarGrad)"
                  radius={[8, 8, 2, 2]}
                  maxBarSize={28}
                  animationDuration={800}
                  animationEasing="ease-out"
                  activeBar={{
                    fill: "#059669",
                    stroke: "#34d399",
                    strokeWidth: 2,
                    filter: "url(#barShadow)",
                  }}
                />
              )}

              {(activeLegend === "all" || activeLegend === "expense") && (
                <Bar
                  dataKey="expense"
                  fill="url(#expenseBarGrad)"
                  radius={[8, 8, 2, 2]}
                  maxBarSize={28}
                  animationDuration={800}
                  animationEasing="ease-out"
                  activeBar={{
                    fill: "#e11d48",
                    stroke: "#fb7185",
                    strokeWidth: 2,
                    filter: "url(#barShadow)",
                  }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>

          {/* Quick Footer Stats Bar */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3 text-xs text-stone-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-medium">
                <TrendingUp size={13} className="text-emerald-600" />
                Total Inflow: <strong className="text-stone-800">{formatCurrency(totalIncome)}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium">
                <TrendingDown size={13} className="text-rose-600" />
                Total Outflow: <strong className="text-stone-800">{formatCurrency(totalExpense)}</strong>
              </span>
            </div>
            <span className="text-[11px] text-stone-400">
              Hover bars for detailed monthly breakdown
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};
