import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { formatCurrency } from "../../utils/formatters";
import type { MonthlyTrendItem } from "../../types/dashboard";

interface SpendingTrendChartProps {
  data: MonthlyTrendItem[];
  isLoading: boolean;
}

export const SpendingTrendChart = ({ data, isLoading }: SpendingTrendChartProps) => {
  return (
    <Card>
      <h3 className="mb-4 text-sm font-medium text-stone-600">Spending Trend</h3>
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : data.length === 0 ? (
        <EmptyState title="No spending trend yet" />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a" }}
            />
            <Line
              type="monotone"
              dataKey="expense"
              stroke="#ea580c"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};
