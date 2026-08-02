import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { dashboardService } from "../services/dashboard.service";
import { budgetService } from "../services/budget.service";
import { SummaryCards } from "../components/dashboard/SummaryCards";
import { ExpenseByCategoryChart } from "../components/dashboard/ExpenseByCategoryChart";
import { IncomeExpenseChart } from "../components/dashboard/IncomeExpenseChart";
import { SpendingTrendChart } from "../components/dashboard/SpendingTrendChart";
import type { DashboardSummary, CategoryBreakdownItem, MonthlyTrendItem } from "../types/dashboard";
import type { Budget } from "../types/budget";

export const Dashboard = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryBreakdownItem[]>([]);
  const [trendData, setTrendData] = useState<MonthlyTrendItem[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [summaryRes, categoryRes, trendRes, budgetRes] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getCategoryBreakdown(),
          dashboardService.getMonthlyTrend(),
          budgetService.getAll(),
        ]);
        setSummary(summaryRes);
        setCategoryData(categoryRes);
        setTrendData(trendRes);
        setBudgets(budgetRes);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const overBudget = budgets.some((b) => (b.percentUsed ?? 0) >= 100);
  const budgetStatus = budgets.length === 0 ? "Not set" : overBudget ? "Over budget" : "On track";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Dashboard</h1>
        <p className="text-sm text-stone-500">Your financial overview at a glance</p>
      </div>

      <SummaryCards summary={summary} isLoading={isLoading} budgetStatus={budgetStatus} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ExpenseByCategoryChart data={categoryData} isLoading={isLoading} />
        <IncomeExpenseChart data={trendData} isLoading={isLoading} />
      </div>

      <SpendingTrendChart data={trendData} isLoading={isLoading} />
    </div>
  );
};
