import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { UploadCloud } from "lucide-react";
import { dashboardService } from "../services/dashboard.service";
import { budgetService } from "../services/budget.service";
import { SummaryCards } from "../components/dashboard/SummaryCards";
import { ExpenseByCategoryChart } from "../components/dashboard/ExpenseByCategoryChart";
import { IncomeExpenseChart } from "../components/dashboard/IncomeExpenseChart";
import { SpendingTrendChart } from "../components/dashboard/SpendingTrendChart";
import { QuickAddBox } from "../components/dashboard/QuickAddBox";
import { Button } from "../components/ui/Button";
import type { DashboardSummary, CategoryBreakdownResponse, MonthlyTrendItem } from "../types/dashboard";
import type { Budget } from "../types/budget";

export const Dashboard = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryBreakdownResponse | null>(null);
  const [trendData, setTrendData] = useState<MonthlyTrendItem[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const overBudget = budgets.some((b) => (b.percentUsed ?? 0) >= 100);
  const budgetStatus = budgets.length === 0 ? "Not set" : overBudget ? "Over budget" : "On track";
  const hasZeroTransactions = summary ? summary.totalIncome === 0 && summary.totalExpense === 0 : false;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-stone-500 dark:text-slate-400">Your financial overview at a glance</p>
        </div>
        <Link to="/import">
          <Button className="w-full sm:w-auto">
            <UploadCloud size={16} />
            Import Statement
          </Button>
        </Link>
      </div>

      {/* Quick Add Natural Language Box */}
      <QuickAddBox onTransactionAdded={loadData} />

      {/* Empty State Call-to-Action if 0 transactions */}
      {!isLoading && hasZeroTransactions && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/60 p-8 text-center sm:p-12">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-600/30">
            <UploadCloud size={32} />
          </div>
          <h2 className="text-xl font-bold text-stone-900">No Transactions Yet</h2>
          <p className="mt-2 max-w-md text-sm text-stone-600">
            You don't need to manually type each transaction! Upload your bank, PhonePe, or Paytm statement and our AI will extract and categorize them automatically.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/import">
              <Button className="bg-orange-600 px-6 py-3 text-base hover:bg-orange-700">
                <UploadCloud size={18} />
                Import Bank/UPI Statement
              </Button>
            </Link>
          </div>
        </div>
      )}

      <SummaryCards summary={summary} isLoading={isLoading} budgetStatus={budgetStatus} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ExpenseByCategoryChart initialData={categoryData} isLoading={isLoading} />
        <IncomeExpenseChart data={trendData} isLoading={isLoading} />
      </div>

      <SpendingTrendChart data={trendData} isLoading={isLoading} />
    </div>
  );
};

