import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { formatCurrency } from "../../utils/formatters";
import type { CategoryBreakdownItem } from "../../types/dashboard";

const COLORS = [
  "#ea580c",
  "#22d3ee",
  "#f59e0b",
  "#ef4444",
  "#10b981",
  "#a855f7",
  "#f472b6",
  "#84cc16",
];

interface ExpenseByCategoryChartProps {
  data: CategoryBreakdownItem[];
  isLoading: boolean;
}

export const ExpenseByCategoryChart = ({
  data,
  isLoading,
}: ExpenseByCategoryChartProps) => {
  return (
    <Card>
      <h3 className="mb-4 text-sm font-medium text-stone-600">
        Expense by Category
      </h3>
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : data.length === 0 ? (
        <EmptyState title="No expense data yet" />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={(entry) => (entry as unknown as CategoryBreakdownItem).category ?? ""}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};
