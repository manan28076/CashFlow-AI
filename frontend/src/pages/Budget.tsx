import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, PiggyBank } from "lucide-react";
import { budgetService } from "../services/budget.service";
import { categoryService } from "../services/category.service";
import { BudgetCard } from "../components/budgets/BudgetCard";
import { BudgetFormModal } from "../components/budgets/BudgetFormModal";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import type { Budget as BudgetType, CreateBudgetPayload } from "../types/budget";
import type { Category } from "../types/category";

export const Budget = () => {
  const [budgets, setBudgets] = useState<BudgetType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetType | null>(null);

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

  const handleAdd = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const handleEdit = (b: BudgetType) => {
    setEditingBudget(b);
    setIsModalOpen(true);
  };

  const handleSubmit = async (payload: CreateBudgetPayload) => {
    try {
      if (editingBudget) {
        await budgetService.update(editingBudget.id, payload);
        toast.success("Budget updated");
      } else {
        await budgetService.create(payload);
        toast.success("Budget added");
      }
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this budget?")) return;
    try {
      await budgetService.remove(id);
      toast.success("Budget deleted");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete budget");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Budget</h1>
          <p className="text-sm text-stone-500">Set monthly limits per category</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={16} />
          Add Budget
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={<PiggyBank size={32} className="text-stone-600" />}
          title="No budgets set"
          description="Set spending limits to keep your finances in check"
          action={<Button onClick={handleAdd}>Add Budget</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              onEdit={() => handleEdit(b)}
              onDelete={() => handleDelete(b.id)}
            />
          ))}
        </div>
      )}

      <BudgetFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        categories={categories}
        initialData={editingBudget}
      />
    </div>
  );
};
