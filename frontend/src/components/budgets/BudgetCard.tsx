import { Pencil, Trash2 } from "lucide-react";
import { Card } from "../ui/Card";
import { formatCurrency, monthName } from "../../utils/formatters";
import { cn } from "../../utils/cn";
import type { Budget } from "../../types/budget";

interface BudgetCardProps {
  budget: Budget;
  onEdit: () => void;
  onDelete: () => void;
}

export const BudgetCard = ({ budget, onEdit, onDelete }: BudgetCardProps) => {
  const percent = Math.min(budget.percentUsed ?? 0, 100);
  const isOver = (budget.percentUsed ?? 0) >= 100;
  const isWarning = (budget.percentUsed ?? 0) >= 80 && !isOver;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-stone-900">
            {budget.category?.name ?? "Category"}
          </p>
          <p className="text-xs text-stone-500">
            {monthName(budget.month)} {budget.year}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            aria-label="Edit budget"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={onDelete}
            className="rounded-md p-1.5 text-stone-500 hover:bg-red-600/15 hover:text-red-600"
            aria-label="Delete budget"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="font-numeric text-stone-500">
          {formatCurrency(budget.spent ?? 0)} of {formatCurrency(budget.amount)}
        </span>
        <span
          className={cn(
            "font-numeric font-semibold",
            isOver ? "text-red-600" : isWarning ? "text-amber-600" : "text-emerald-600"
          )}
        >
          {Math.round(budget.percentUsed ?? 0)}%
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isOver ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </Card>
  );
};
