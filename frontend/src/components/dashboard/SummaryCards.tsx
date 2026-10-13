import { Link } from "react-router-dom";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  ArrowUpRight,
} from "lucide-react";
import { Skeleton } from "../ui/Skeleton";
import { formatCurrency } from "../../utils/formatters";
import { cn } from "../../utils/cn";
import type { DashboardSummary } from "../../types/dashboard";

interface SummaryCardsProps {
  summary: DashboardSummary | null;
  isLoading: boolean;
  budgetStatus: string;
}

interface CardConfig {
  label: string;
  value: string;
  icon: typeof Wallet;
  to: string;
  accentGradient: string;
  borderColorHover: string;
  shadowHover: string;
  bgWashHover: string;
  iconBg: string;
  iconColor: string;
  iconHoverBg: string;
  subtitle: string;
}

const getCardsConfig = (
  summary: DashboardSummary,
  budgetStatus: string
): CardConfig[] => [
  {
    label: "Total Balance",
    value: formatCurrency(summary.totalBalance),
    icon: Wallet,
    to: "/accounts",
    accentGradient: "from-orange-500 via-amber-500 to-yellow-500",
    borderColorHover: "hover:border-orange-300",
    shadowHover: "hover:shadow-orange-500/10",
    bgWashHover: "hover:from-orange-50/40 hover:via-white hover:to-amber-50/20",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    iconHoverBg: "group-hover:bg-orange-600 group-hover:text-white",
    subtitle: "Net liquidity across accounts",
  },
  {
    label: "Total Income",
    value: formatCurrency(summary.totalIncome),
    icon: TrendingUp,
    to: "/transactions?type=INCOME",
    accentGradient: "from-emerald-500 via-teal-500 to-green-500",
    borderColorHover: "hover:border-emerald-300",
    shadowHover: "hover:shadow-emerald-500/10",
    bgWashHover: "hover:from-emerald-50/40 hover:via-white hover:to-teal-50/20",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    iconHoverBg: "group-hover:bg-emerald-600 group-hover:text-white",
    subtitle: "All-time inflows & earnings",
  },
  {
    label: "Total Expense",
    value: formatCurrency(summary.totalExpense),
    icon: TrendingDown,
    to: "/transactions?type=EXPENSE",
    accentGradient: "from-rose-500 via-red-500 to-pink-500",
    borderColorHover: "hover:border-rose-300",
    shadowHover: "hover:shadow-rose-500/10",
    bgWashHover: "hover:from-rose-50/40 hover:via-white hover:to-red-50/20",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    iconHoverBg: "group-hover:bg-rose-600 group-hover:text-white",
    subtitle: "All-time outflows & spend",
  },
  {
    label: "This Month",
    value: formatCurrency(summary.currentMonthSpending),
    icon: Calendar,
    to: "/transactions",
    accentGradient: "from-amber-500 via-orange-500 to-yellow-500",
    borderColorHover: "hover:border-amber-300",
    shadowHover: "hover:shadow-amber-500/10",
    bgWashHover: "hover:from-amber-50/40 hover:via-white hover:to-orange-50/20",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    iconHoverBg: "group-hover:bg-amber-600 group-hover:text-white",
    subtitle: "Current billing cycle outflow",
  },
  {
    label: "Budget Status",
    value: budgetStatus,
    icon: Target,
    to: "/budget",
    accentGradient:
      budgetStatus === "Over budget"
        ? "from-red-500 to-rose-600"
        : budgetStatus === "On track"
        ? "from-emerald-500 to-teal-500"
        : "from-sky-500 to-blue-500",
    borderColorHover:
      budgetStatus === "Over budget"
        ? "hover:border-red-300"
        : "hover:border-sky-300",
    shadowHover:
      budgetStatus === "Over budget"
        ? "hover:shadow-red-500/10"
        : "hover:shadow-sky-500/10",
    bgWashHover:
      budgetStatus === "Over budget"
        ? "hover:from-red-50/40 hover:via-white hover:to-rose-50/20"
        : "hover:from-sky-50/40 hover:via-white hover:to-blue-50/20",
    iconBg: budgetStatus === "Over budget" ? "bg-red-50" : "bg-sky-50",
    iconColor: budgetStatus === "Over budget" ? "text-red-600" : "text-sky-600",
    iconHoverBg:
      budgetStatus === "Over budget"
        ? "group-hover:bg-red-600 group-hover:text-white"
        : "group-hover:bg-sky-600 group-hover:text-white",
    subtitle: "Monthly category limits",
  },
];

export const SummaryCards = ({
  summary,
  isLoading,
  budgetStatus,
}: SummaryCardsProps) => {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  const cards = getCardsConfig(summary, budgetStatus);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const isBudget = card.label === "Budget Status";

        return (
          <Link
            key={card.label}
            to={card.to}
            className={cn(
              "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-xs",
              "transition-all duration-300 ease-out",
              "hover:-translate-y-1.5 hover:shadow-xl hover:scale-[1.015] active:scale-[0.99]",
              card.borderColorHover,
              card.shadowHover,
              `hover:bg-gradient-to-br ${card.bgWashHover}`
            )}
          >
            {/* Top Accent Stripe - Expands and glows on hover */}
            <div
              className={cn(
                "absolute inset-x-0 top-0 h-1 bg-gradient-to-r transition-all duration-300 group-hover:h-1.5",
                card.accentGradient
              )}
            />

            <div>
              {/* Header: Label + Animated Icon Pill */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 transition-colors group-hover:text-stone-700">
                  {card.label}
                </span>

                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200/50 shadow-2xs",
                    "transition-all duration-300 ease-out group-hover:rotate-6 group-hover:scale-110",
                    card.iconBg,
                    card.iconColor,
                    card.iconHoverBg
                  )}
                >
                  <Icon size={16} />
                </div>
              </div>

              {/* Main Metric Value */}
              <div className="mt-3">
                {isBudget ? (
                  <div className="flex items-center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-all duration-300",
                        budgetStatus === "Over budget"
                          ? "border border-red-200 bg-red-50 text-red-700 group-hover:bg-red-100 group-hover:shadow-xs"
                          : budgetStatus === "On track"
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 group-hover:shadow-xs"
                          : "border border-stone-200 bg-stone-100 text-stone-700"
                      )}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          budgetStatus === "Over budget"
                            ? "animate-pulse bg-red-500"
                            : budgetStatus === "On track"
                            ? "bg-emerald-500"
                            : "bg-stone-400"
                        )}
                      />
                      {card.value}
                    </span>
                  </div>
                ) : (
                  <span className="font-numeric text-xl font-bold tracking-tight text-stone-900 transition-all duration-300 group-hover:scale-[1.03] group-hover:text-stone-950 sm:text-2xl origin-left inline-block">
                    {card.value}
                  </span>
                )}
              </div>
            </div>

            {/* Footer Subtitle + Interactive Micro-indicator */}
            <div className="mt-3 flex items-center justify-between border-t border-stone-100/90 pt-2.5 text-[11px] text-stone-400">
              <span className="font-medium text-stone-500 transition-colors group-hover:text-stone-700">
                {card.subtitle}
              </span>
              <div className="flex items-center gap-0.5 text-stone-400 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-stone-700">
                <ArrowUpRight size={13} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
