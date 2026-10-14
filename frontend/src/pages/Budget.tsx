import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, PiggyBank, Calendar, Pencil, Trash2, Target } from "lucide-react";
import { budgetService } from "../services/budget.service";
import { categoryService } from "../services/category.service";
import { BudgetCard } from "../components/budgets/BudgetCard";
import { BudgetFormModal } from "../components/budgets/BudgetFormModal";
import { MonthlyBudgetModal } from "../components/budgets/MonthlyBudgetModal";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Card } from "../components/ui/Card";
import { formatCurrency, monthName } from "../utils/formatters";
import { cn } from "../utils/cn";
import type {
  Budget as BudgetType,
  MonthlyBudget as MonthlyBudgetType,
  CreateBudgetPayload,
  SetMonthlyBudgetPayload,
} from "../types/budget";
import type { Category } from "../types/category";

export const Budget = () => {
  const [budgets, setBudgets] = useState<BudgetType[]>([]);
  const [monthlyBudgets, setMonthlyBudgets] = useState<MonthlyBudgetType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Category Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetType | null>(null);
  const [modalDefaultCategoryId, setModalDefaultCategoryId] = useState<string>("");

  // Dedicated Monthly Budget Modal state
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Selected month filter for overall summary and active cards
  const [filterMonth, setFilterMonth] = useState<number | null>(currentMonth);
  const [filterYear, setFilterYear] = useState<number | null>(currentYear);

  const activeM = filterMonth || currentMonth;
  const activeY = filterYear || currentYear;

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [budgetData, categoryData, monthlyData] = await Promise.all([
        budgetService.getAll(),
        categoryService.getAll(),
        budgetService.getMonthlyBudgets(),
      ]);
      setBudgets(budgetData);
      setCategories(categoryData);
      setMonthlyBudgets(monthlyData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load budgets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter out pure income categories (Salary, Freelance) and system category (Overall)
  const expenseCategories = useMemo(() => {
    return categories.filter(
      (c) => c.name !== "Salary" && c.name !== "Freelance" && c.name !== "Overall"
    );
  }, [categories]);

  // Overall monthly budget record for active month if configured
  const activeMonthlyBudget = useMemo(() => {
    return monthlyBudgets.find((mb) => mb.month === activeM && mb.year === activeY);
  }, [monthlyBudgets, activeM, activeY]);

  const isCustomMonthlyBudget = Boolean(
    activeMonthlyBudget && activeMonthlyBudget.isSet && activeMonthlyBudget.amount > 0
  );

  // Group budgets by Category, ensuring ALL expense categories are represented (no Overall)
  const groupedCategories = useMemo(() => {
    const map = new Map<string, { category: Category; budgets: BudgetType[] }>();

    // First ensure every expense category exists in the map
    expenseCategories.forEach((cat) => {
      map.set(cat.id, { category: cat, budgets: [] });
    });

    budgets.forEach((b) => {
      // Exclude any accidental overall budget item
      if (b.category?.name === "Overall") return;

      const catId = b.categoryId;
      if (!map.has(catId)) {
        const catObj =
          b.category ||
          categories.find((c) => c.id === catId) || {
            id: catId,
            name: "Uncategorized",
          };
        map.set(catId, { category: catObj, budgets: [] });
      }
      map.get(catId)!.budgets.push(b);
    });

    // Sort: Configured categories with limits first, then categories with spending, then alphabetically
    return Array.from(map.values()).sort((a, b) => {
      const aMaxLimit = Math.max(...a.budgets.map((x) => x.amount || 0), 0);
      const bMaxLimit = Math.max(...b.budgets.map((x) => x.amount || 0), 0);
      const aMaxSpent = Math.max(...a.budgets.map((x) => x.spent || 0), 0);
      const bMaxSpent = Math.max(...b.budgets.map((x) => x.spent || 0), 0);

      if (aMaxLimit > 0 && bMaxLimit === 0) return -1;
      if (bMaxLimit > 0 && aMaxLimit === 0) return 1;
      if (aMaxSpent > 0 && bMaxSpent === 0) return -1;
      if (bMaxSpent > 0 && aMaxSpent === 0) return 1;
      return (a.category.name || "").localeCompare(b.category.name || "");
    });
  }, [budgets, categories, expenseCategories]);

  // Unique list of active month/years found across monthlyBudgets, category budgets, and current month
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    // Always include current month
    set.add(`${currentYear}-${currentMonth}`);

    monthlyBudgets.forEach((mb) => {
      if (mb.amount > 0 || mb.spent > 0) {
        set.add(`${mb.year}-${mb.month}`);
      }
    });

    budgets.forEach((b) => {
      if ((b.amount && b.amount > 0) || (b.spent && b.spent > 0)) {
        set.add(`${b.year}-${b.month}`);
      }
    });

    return Array.from(set)
      .map((key) => {
        const [year, month] = key.split("-").map(Number);
        return { year, month };
      })
      .sort((a, b) => (b.year !== a.year ? b.year - a.year : b.month - a.month));
  }, [budgets, monthlyBudgets, currentMonth, currentYear]);

  // Calculate overall summary metrics for the selected month
  const summary = useMemo(() => {
    const activeBudgets =
      filterMonth && filterYear
        ? budgets.filter((b) => b.month === filterMonth && b.year === filterYear)
        : budgets;

    const categoryBudgets = activeBudgets.filter(
      (b) => b.category?.name !== "Overall"
    );

    let totalBudget = 0;
    let totalSpent = 0;

    if (isCustomMonthlyBudget && activeMonthlyBudget) {
      totalBudget = activeMonthlyBudget.amount;
      totalSpent = activeMonthlyBudget.spent;
    } else {
      totalBudget = categoryBudgets.reduce((acc, b) => acc + (b.amount || 0), 0);
      totalSpent =
        activeMonthlyBudget?.spent ??
        categoryBudgets.reduce((acc, b) => acc + (b.spent || 0), 0);
    }

    const remaining = totalBudget - totalSpent;
    const percent =
      totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
    const configuredCount = categoryBudgets.filter((b) => (b.amount || 0) > 0).length;
    const totalCount = expenseCategories.length || categoryBudgets.length;

    return {
      totalBudget,
      totalSpent,
      remaining,
      percent,
      configuredCount,
      totalCount,
    };
  }, [
    budgets,
    filterMonth,
    filterYear,
    expenseCategories,
    isCustomMonthlyBudget,
    activeMonthlyBudget,
  ]);

  const handleAddCategoryBudget = () => {
    setEditingBudget(null);
    setModalDefaultCategoryId(expenseCategories[0]?.id || "");
    setIsCategoryModalOpen(true);
  };

  const handleAddForCategory = (categoryId: string) => {
    setEditingBudget(null);
    setModalDefaultCategoryId(categoryId);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategoryBudget = (b: BudgetType) => {
    setEditingBudget(b);
    setModalDefaultCategoryId(b.categoryId);
    setIsCategoryModalOpen(true);
  };

  const handleSubmitCategoryBudget = async (
    payload: CreateBudgetPayload,
    repeatMonths: number = 1
  ) => {
    try {
      if (
        editingBudget &&
        !editingBudget.id.startsWith("unset_") &&
        !editingBudget.id.startsWith("rec_")
      ) {
        await budgetService.update(editingBudget.id, payload);
        toast.success("Budget limit updated");
      } else {
        if (repeatMonths > 1) {
          let curM = payload.month;
          let curY = payload.year;
          for (let i = 0; i < repeatMonths; i++) {
            await budgetService.create({
              categoryId: payload.categoryId,
              amount: payload.amount,
              month: curM,
              year: curY,
            });
            curM += 1;
            if (curM > 12) {
              curM = 1;
              curY += 1;
            }
          }
          toast.success(`Budget created for ${repeatMonths} months`);
        } else {
          await budgetService.create(payload);
          toast.success("Budget limit set");
        }
      }
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const handleDeleteCategoryBudget = async (id: string) => {
    if (!confirm("Reset budget limit for this category?")) return;
    try {
      await budgetService.remove(id);
      toast.success("Budget limit reset");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset budget");
    }
  };

  // Month Overall Budget Handlers
  const handleOpenMonthlyBudgetModal = () => {
    setIsMonthlyModalOpen(true);
  };

  const handleSubmitMonthlyBudget = async (payload: SetMonthlyBudgetPayload) => {
    try {
      await budgetService.setMonthlyBudget(payload);
      toast.success(
        payload.repeatMonths && payload.repeatMonths > 1
          ? `Monthly budget saved for ${payload.repeatMonths} months`
          : "Monthly budget saved"
      );
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save monthly budget");
    }
  };

  const handleResetMonthlyBudget = async () => {
    if (!confirm(`Reset overall monthly budget limit for ${monthName(activeM)} ${activeY}?`)) {
      return;
    }
    try {
      await budgetService.removeMonthlyBudget(activeM, activeY);
      toast.success("Monthly budget reset");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset monthly budget");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white">Budget</h1>
          <p className="text-sm text-stone-500 dark:text-slate-400">
            Set and track spending limits by monthly total or per category
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            onClick={handleOpenMonthlyBudgetModal}
            variant="secondary"
            className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-medium dark:border-blue-800/60 dark:text-blue-300 dark:hover:bg-blue-950/70"
          >
            <Target size={16} />
            {isCustomMonthlyBudget ? "Edit Monthly Budget" : "Set Monthly Budget"}
          </Button>
          <Button onClick={handleAddCategoryBudget} className="gap-2 font-medium">
            <Plus size={16} />
            Add Category Limit
          </Button>
        </div>
      </div>

      {/* Focus Month Selector Pills */}
      {availableMonths.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 text-sm scrollbar-thin scrollbar-thumb-stone-200 dark:scrollbar-thumb-slate-800">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider shrink-0 mr-1 dark:text-slate-400">
            Focus Month:
          </span>
          <button
            onClick={() => {
              setFilterMonth(null);
              setFilterYear(null);
            }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer",
              filterMonth === null
                ? "bg-stone-900 text-white shadow-xs font-semibold dark:bg-blue-600 dark:text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            )}
          >
            All Months
          </button>
          {availableMonths.map((m) => {
            const isActive = filterMonth === m.month && filterYear === m.year;
            const isCurrent = m.month === currentMonth && m.year === currentYear;
            return (
              <button
                key={`${m.year}-${m.month}`}
                onClick={() => {
                  setFilterMonth(m.month);
                  setFilterYear(m.year);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs font-semibold dark:bg-blue-600 dark:text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                )}
              >
                <span>
                  {monthName(m.month)} {m.year}
                </span>
                {isCurrent && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[9px] font-bold uppercase",
                      isActive
                        ? "bg-indigo-400/40 text-white"
                        : "bg-stone-200 text-stone-600 dark:bg-slate-700 dark:text-slate-300"
                    )}
                  >
                    Now
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* TOP BOX: Dedicated Month Overall Budget Card */}
      <Card className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-800 dark:from-[#0b1329] dark:via-[#0e1a38] dark:to-[#11224d] text-white border-none dark:border dark:border-blue-900/50 shadow-md p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 text-stone-300 font-medium">
                <Calendar size={14} className="text-stone-400" />
                <span>
                  {filterMonth && filterYear
                    ? `${monthName(filterMonth)} ${filterYear} Overall Budget`
                    : "Monthly Overall Budget"}
                </span>
              </div>

              {isCustomMonthlyBudget ? (
                <span className="rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 px-2.5 py-0.5 text-[11px] font-semibold flex items-center gap-1">
                  <Target size={12} /> Total Monthly Target Set
                </span>
              ) : summary.totalBudget > 0 ? (
                <span className="rounded-full bg-stone-700/80 px-2.5 py-0.5 text-[11px] font-semibold text-stone-300">
                  {summary.configuredCount} of {summary.totalCount} categories budgeted
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-semibold">
                  No Monthly Limit Set
                </span>
              )}
            </div>

            {/* Spent of Limit Line with Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap mt-0.5">
              <span className="text-2xl sm:text-3xl font-bold font-numeric">
                {formatCurrency(summary.totalSpent)}
              </span>
              <span className="text-stone-300 text-sm font-numeric flex items-center gap-2">
                spent of{" "}
                <span className="font-semibold text-white text-base">
                  {summary.totalBudget > 0
                    ? formatCurrency(summary.totalBudget)
                    : "₹0 limit"}
                </span>

                {/* Edit & Reset Monthly Budget Buttons */}
                <button
                  onClick={handleOpenMonthlyBudgetModal}
                  className="rounded-md bg-stone-700/90 px-2.5 py-1 text-xs font-medium text-stone-200 hover:bg-stone-600 hover:text-white transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="Set or change total monthly budget limit"
                >
                  <Pencil size={12} />
                  {isCustomMonthlyBudget ? "Edit Limit" : "Set Monthly Budget"}
                </button>

                {isCustomMonthlyBudget && (
                  <button
                    onClick={handleResetMonthlyBudget}
                    className="rounded-md p-1 text-stone-400 hover:bg-stone-700 hover:text-red-400 transition-colors cursor-pointer"
                    title="Reset monthly budget limit"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </span>
            </div>

            <p className="text-xs mt-0.5">
              {summary.totalBudget === 0 ? (
                <span className="text-amber-400 font-medium">
                  No monthly budget limit set yet. Click "Set Monthly Budget" to establish a spending target for {monthName(activeM)} {activeY}!
                </span>
              ) : summary.remaining >= 0 ? (
                <span className="text-emerald-400 font-medium">
                  {formatCurrency(summary.remaining)} remaining safe to spend this month
                </span>
              ) : (
                <span className="text-red-400 font-medium">
                  {formatCurrency(Math.abs(summary.remaining))} over monthly budget!
                </span>
              )}
            </p>
          </div>

          {/* Month Progress Gauge */}
          <div className="flex flex-col gap-2 min-w-[200px] md:max-w-[280px] w-full">
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-400">Monthly Budget Utilized</span>
              <span
                className={cn(
                  "font-numeric font-bold",
                  summary.totalBudget === 0
                    ? "text-stone-400"
                    : summary.percent >= 100
                    ? "text-red-400"
                    : summary.percent >= 80
                    ? "text-amber-400"
                    : "text-emerald-400"
                )}
              >
                {summary.totalBudget > 0 ? `${Math.round(summary.percent)}%` : "0% limit"}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-700/80">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  summary.totalBudget === 0
                    ? "bg-stone-600"
                    : summary.percent >= 100
                    ? "bg-red-500"
                    : summary.percent >= 80
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                )}
                style={{
                  width: `${
                    summary.totalBudget > 0
                      ? summary.percent
                      : summary.totalSpent > 0
                      ? 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Category Section Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-white">Category Budgets</h2>
          <p className="text-xs text-stone-500 dark:text-slate-400">
            Set individual limits for specific categories like Food, Bills, Shopping, Travel, etc.
          </p>
        </div>
      </div>

      {/* Main Budget Cards List: All Expense Categories (strictly real categories, no Overall card) */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : groupedCategories.length === 0 ? (
        <EmptyState
          icon={<PiggyBank size={36} className="text-stone-400" />}
          title="No categories found"
          description="Categories will appear here once loaded."
          action={<Button onClick={handleAddCategoryBudget}>Add First Category Limit</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {groupedCategories.map(({ category, budgets: catBudgets }) => (
            <BudgetCard
              key={category.id}
              category={category}
              budgets={catBudgets}
              onEdit={handleEditCategoryBudget}
              onDelete={handleDeleteCategoryBudget}
              onAddMonth={handleAddForCategory}
              globalMonthFilter={filterMonth}
              globalYearFilter={filterYear}
            />
          ))}
        </div>
      )}

      {/* Category Budget Modal */}
      <BudgetFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleSubmitCategoryBudget}
        categories={categories}
        initialData={editingBudget}
        defaultCategoryId={modalDefaultCategoryId}
      />

      {/* Dedicated Month Overall Budget Modal */}
      <MonthlyBudgetModal
        isOpen={isMonthlyModalOpen}
        onClose={() => setIsMonthlyModalOpen(false)}
        onSubmit={handleSubmitMonthlyBudget}
        initialMonth={activeM}
        initialYear={activeY}
        currentAmount={activeMonthlyBudget?.amount || 0}
      />
    </div>
  );
};
