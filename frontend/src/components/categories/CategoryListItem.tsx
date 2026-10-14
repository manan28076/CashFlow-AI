import { Trash2, ArrowDownRight, ArrowUpRight, Tag } from "lucide-react";
import type { Category } from "../../types/category";
import { cn } from "../../utils/cn";

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  Food: { bg: "#06b6d4", border: "border-cyan-200", text: "text-cyan-700", glow: "rgba(6, 182, 212, 0.25)" },
  Shopping: { bg: "#ef4444", border: "border-red-200", text: "text-red-700", glow: "rgba(239, 68, 68, 0.25)" },
  Transfer: { bg: "#10b981", border: "border-emerald-200", text: "text-emerald-700", glow: "rgba(16, 185, 129, 0.25)" },
  Entertainment: { bg: "#f59e0b", border: "border-amber-200", text: "text-amber-700", glow: "rgba(245, 158, 11, 0.25)" },
  Bills: { bg: "#8b5cf6", border: "border-purple-200", text: "text-purple-700", glow: "rgba(139, 92, 246, 0.25)" },
  Healthcare: { bg: "#ec4899", border: "border-pink-200", text: "text-pink-700", glow: "rgba(236, 72, 153, 0.25)" },
  Travel: { bg: "#f97316", border: "border-orange-200", text: "text-orange-700", glow: "rgba(249, 115, 22, 0.25)" },
  Education: { bg: "#6366f1", border: "border-indigo-200", text: "text-indigo-700", glow: "rgba(99, 102, 241, 0.25)" },
  Investment: { bg: "#14b8a6", border: "border-teal-200", text: "text-teal-700", glow: "rgba(20, 184, 166, 0.25)" },
  Salary: { bg: "#22c55e", border: "border-green-200", text: "text-green-700", glow: "rgba(34, 197, 94, 0.25)" },
  Freelance: { bg: "#10b981", border: "border-emerald-200", text: "text-emerald-700", glow: "rgba(16, 185, 129, 0.25)" },
  Other: { bg: "#64748b", border: "border-slate-200", text: "text-slate-700", glow: "rgba(100, 116, 139, 0.25)" },
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

  const colorConfig = CATEGORY_COLORS[category.name] || {
    bg: isIncome ? "#10b981" : "#f97316",
    border: isIncome ? "border-emerald-200" : "border-orange-200",
    text: isIncome ? "text-emerald-700" : "text-orange-700",
    glow: isIncome ? "rgba(16, 185, 129, 0.25)" : "rgba(249, 115, 22, 0.25)",
  };

  const monogram = category.name.slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        "group relative flex items-center justify-between rounded-2xl border border-stone-200/90 bg-white p-3.5 sm:p-4 shadow-xs",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-lg hover:scale-[1.015] hover:border-stone-300",
        "hover:bg-gradient-to-r hover:from-stone-50/60 hover:to-white"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Monogram Badge with Soft Glow & Hover Tilt */}
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold text-white shadow-md transition-all duration-300 ease-out group-hover:rotate-6 group-hover:scale-110 shrink-0"
          style={{
            backgroundColor: colorConfig.bg,
            boxShadow: `0 4px 12px ${colorConfig.glow}`,
          }}
        >
          {monogram}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-stone-900 group-hover:text-stone-950 transition-colors">
              {category.name}
            </h4>
          </div>

          <div className="flex items-center gap-1.5 mt-0.5">
            {isIncome ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/80 shadow-2xs">
                <ArrowUpRight size={10} />
                Income
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600 border border-stone-200/80">
                <ArrowDownRight size={10} />
                Expense
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Delete Action Button */}
      <button
        onClick={onDelete}
        className="rounded-xl p-2 text-stone-300 opacity-60 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all duration-200 cursor-pointer hover:scale-110"
        aria-label="Delete category"
        title="Delete category"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
};
