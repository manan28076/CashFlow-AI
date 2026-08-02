import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { Card } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { formatCurrency } from "../../utils/formatters";
import type { MonthlyTrendItem } from "../../types/dashboard";

interface IncomeExpenseChartProps {
  data: MonthlyTrendItem[];
  isLoading: boolean;
}

export const IncomeExpenseChart = ({ data, isLoading }: IncomeExpenseChartProps) => {
  return (
    <Card>
      <h3 className="mb-4 text-sm font-medium text-stone-600">
        Monthly Income vs Expense
      </h3>
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : data.length === 0 ? (
        <EmptyState title="No trend data yet" />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a" }}
            />
            <Legend />
            <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};
