import { Wallet, TrendingUp, TrendingDown, Calendar, Target } from "lucide-react";
import { Card } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { formatCurrency } from "../../utils/formatters";
import type { DashboardSummary } from "../../types/dashboard";

interface SummaryCardsProps {
  summary: DashboardSummary | null;
  isLoading: boolean;
  budgetStatus: string;
}

const items = (summary: DashboardSummary, budgetStatus: string) => [
  {
    label: "Total Balance",
    value: formatCurrency(summary.totalBalance),
    icon: Wallet,
    color: "text-orange-600",
  },
  {
    label: "Total Income",
    value: formatCurrency(summary.totalIncome),
    icon: TrendingUp,
    color: "text-emerald-600",
  },
  {
    label: "Total Expense",
    value: formatCurrency(summary.totalExpense),
    icon: TrendingDown,
    color: "text-red-600",
  },
  {
    label: "This Month",
    value: formatCurrency(summary.currentMonthSpending),
    icon: Calendar,
    color: "text-amber-600",
  },
  {
    label: "Budget Status",
    value: budgetStatus,
    icon: Target,
    color: "text-sky-600",
  },
];

export const SummaryCards = ({ summary, isLoading, budgetStatus }: SummaryCardsProps) => {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items(summary, budgetStatus).map(({ label, value, icon: Icon, color }) => (
        <Card key={label} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-500">{label}</span>
            <Icon size={18} className={color} />
          </div>
          <span className="text-xl font-numeric font-semibold text-stone-900">{value}</span>
        </Card>
      ))}
    </div>
  );
};
