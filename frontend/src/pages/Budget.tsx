import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, PiggyBank, Calendar } from "lucide-react";
import { budgetService } from "../services/budget.service";
import { categoryService } from "../services/category.service";
import { BudgetCard } from "../components/budgets/BudgetCard";
import { BudgetFormModal } from "../components/budgets/BudgetFormModal";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Card } from "../components/ui/Card";
import { formatCurrency, monthName } from "../utils/formatters";
import { cn } from "../utils/cn";
import type { Budget as BudgetType, CreateBudgetPayload } from "../types/budget";
import type { Category } from "../types/category";

export const Budget = () => {
  const [budgets, setBudgets] = useState<BudgetType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetType | null>(null);
  const [modalDefaultCategoryId, setModalDefaultCategoryId] = useState<string>("");

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Selected month filter for overall summary and active cards
  const [filterMonth, setFilterMonth] = useState<number | null>(currentMonth);
  const [filterYear, setFilterYear] = useState<number | null>(currentYear);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [budgetData, categoryData] = await Promise.all([
        budgetService.getAll(),
        categoryService.getAll(),
      ]);
      setBudgets(budgetData);
      setCategories(categoryData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load budgets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter out pure income categories (Salary, Freelance)
  const expenseCategories = useMemo(() => {
    return categories.filter(
      (c) => c.name !== "Salary" && c.name !== "Freelance"
    );
  }, [categories]);

  // Group budgets by Category, ensuring ALL expense categories are represented
  const groupedCategories = useMemo(() => {
    const map = new Map<string, { category: Category; budgets: BudgetType[] }>();

    // First ensure every expense category exists in the map
    expenseCategories.forEach((cat) => {
      map.set(cat.id, { category: cat, budgets: [] });
    });

    budgets.forEach((b) => {
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

    // Sort: Configured categories with limits first, then categories with spending, then unconfigured
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

  // Unique list of active month/years found across budgets (or current month)
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    // Always include current month
    set.add(`${currentYear}-${currentMonth}`);

    budgets.forEach((b) => {
      // Include month if budget has an amount OR has spent > 0
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
  }, [budgets, currentMonth, currentYear]);

  // Calculate overall summary metrics for the selected month
  const summary = useMemo(() => {
    const activeBudgets =
      filterMonth && filterYear
        ? budgets.filter((b) => b.month === filterMonth && b.year === filterYear)
        : budgets;

    const totalBudget = activeBudgets.reduce((acc, b) => acc + (b.amount || 0), 0);
    const totalSpent = activeBudgets.reduce((acc, b) => acc + (b.spent || 0), 0);
    const remaining = totalBudget - totalSpent;
    const percent = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
    const configuredCount = activeBudgets.filter((b) => (b.amount || 0) > 0).length;
    const totalCount = expenseCategories.length || activeBudgets.length;

    return {
      totalBudget,
      totalSpent,
      remaining,
      percent,
      configuredCount,
      totalCount,
    };
  }, [budgets, filterMonth, filterYear, expenseCategories]);

  const handleAdd = () => {
    setEditingBudget(null);
    setModalDefaultCategoryId(expenseCategories[0]?.id || "");
    setIsModalOpen(true);
  };

  const handleAddForCategory = (categoryId: string) => {
    setEditingBudget(null);
    setModalDefaultCategoryId(categoryId);
    setIsModalOpen(true);
  };

  const handleEdit = (b: BudgetType) => {
    setEditingBudget(b);
    setModalDefaultCategoryId(b.categoryId);
    setIsModalOpen(true);
  };

  const handleSubmit = async (
    payload: CreateBudgetPayload,
    repeatMonths: number = 1
  ) => {
    try {
      if (editingBudget && !editingBudget.id.startsWith("unset_") && !editingBudget.id.startsWith("rec_")) {
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

  const handleDelete = async (id: string) => {
    if (!confirm("Reset budget limit for this category?")) return;
    try {
      await budgetService.remove(id);
      toast.success("Budget limit reset");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset budget");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Budget</h1>
          <p className="text-sm text-stone-500">
            Set and track monthly spending limits for every category
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2 self-start sm:self-auto">
          <Plus size={16} />
          + Add Category Budget
        </Button>
      </div>

      {/* Focus Month Selector Pills */}
      {availableMonths.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 text-sm scrollbar-thin">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider shrink-0 mr-1">
            Focus Month:
          </span>
          <button
            onClick={() => {
              setFilterMonth(null);
              setFilterYear(null);
            }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0",
              filterMonth === null
                ? "bg-stone-900 text-white shadow-xs font-semibold"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
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
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1.5",
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs font-semibold"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
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
                        : "bg-stone-200 text-stone-600"
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

      {/* Total Monthly Budget Overview Banner */}
      <Card className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-800 text-white border-none shadow-md p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-stone-300 text-xs font-medium">
              <Calendar size={14} className="text-stone-400" />
              <span>
                {filterMonth && filterYear
                  ? `${monthName(filterMonth)} ${filterYear} Budget Overview`
                  : "Overall Budget Overview"}
              </span>
              <span className="rounded-full bg-stone-700/80 px-2 py-0.5 text-[10px] font-semibold text-stone-300">
                {summary.configuredCount} of {summary.totalCount} categories budgeted
              </span>
            </div>

            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-2xl sm:text-3xl font-bold font-numeric">
                {formatCurrency(summary.totalSpent)}
              </span>
              <span className="text-stone-300 text-sm font-numeric">
                spent of{" "}
                <span className="font-semibold text-white">
                  {summary.totalBudget > 0
                    ? formatCurrency(summary.totalBudget)
                    : "₹0 limit"}
                </span>
              </span>
            </div>

            <p className="text-xs mt-0.5">
              {summary.totalBudget === 0 ? (
                <span className="text-amber-400 font-medium">
                  Categories default to ₹0 limit. Click "Set Limit" on any category card below to start budgeting!
                </span>
              ) : summary.remaining >= 0 ? (
                <span className="text-emerald-400 font-medium">
                  {formatCurrency(summary.remaining)} remaining safe to spend
                </span>
              ) : (
                <span className="text-red-400 font-medium">
                  {formatCurrency(Math.abs(summary.remaining))} over allocated budget!
                </span>
              )}
            </p>
          </div>

          {/* Overall Progress Gauge */}
          <div className="flex flex-col gap-2 min-w-[200px] md:max-w-[280px] w-full">
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-400">Total Monthly Budget Utilized</span>
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

      {/* Main Budget Cards List: All Expense Categories */}
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
          action={<Button onClick={handleAdd}>Add First Budget</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {groupedCategories.map(({ category, budgets: catBudgets }) => (
            <BudgetCard
              key={category.id}
              category={category}
              budgets={catBudgets}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddMonth={handleAddForCategory}
              globalMonthFilter={filterMonth}
              globalYearFilter={filterYear}
            />
          ))}
        </div>
      )}

      {/* Budget Creation & Edit Modal */}
      <BudgetFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        categories={categories}
        initialData={editingBudget}
        defaultCategoryId={modalDefaultCategoryId}
      />
    </div>
  );
};
