import { Trash2, ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Category } from "../../types/category";

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#06b6d4",
  Shopping: "#ef4444",
  Transfer: "#10b981",
  Entertainment: "#f59e0b",
  Bills: "#8b5cf6",
  Healthcare: "#ec4899",
  Travel: "#f97316",
  Education: "#6366f1",
  Investment: "#14b8a6",
  Salary: "#22c55e",
  Freelance: "#10b981",
  Other: "#64748b",
};

interface CategoryListItemProps {
  category: Category;
  onDelete: () => void;
}

export const CategoryListItem = ({ category, onDelete }: CategoryListItemProps) => {
  const isIncome =
    category.type === "INCOME" ||
    category.name === "Salary" ||
    category.name === "Freelance";

  const defaultColor = isIncome ? "#10b981" : "#f97316";
  const color = CATEGORY_COLORS[category.name] || defaultColor;

  return (
    <div className="flex items-center justify-between rounded-xl border border-stone-200/90 bg-white px-4 py-3 shadow-2xs hover:shadow-xs transition-shadow">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white shadow-xs shrink-0"
          style={{ backgroundColor: color }}
        >
          {category.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <span className="text-sm font-semibold text-stone-900">{category.name}</span>
          <div className="flex items-center gap-1 mt-0.5">
            {isIncome ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <ArrowUpRight size={10} />
                Income
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">
                <ArrowDownRight size={10} />
                Expense
              </span>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={onDelete}
        className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
        aria-label="Delete category"
        title="Delete category"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};
