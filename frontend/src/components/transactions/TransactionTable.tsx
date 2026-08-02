import { AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { formatCurrency, formatDate } from "../../utils/formatters";
import type { Transaction } from "../../types/transaction";
import { cn } from "../../utils/cn";

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionTable = ({
  transactions,
  isLoading,
  onEdit,
  onDelete,
}: TransactionTableProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return <EmptyState title="No transactions found" description="Try adjusting your filters or add a new transaction" />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200">
      <table className="min-w-full divide-y divide-stone-800 text-sm">
        <thead className="bg-white text-left text-xs uppercase tracking-wide text-stone-500">
          <tr>
            <th className="px-4 py-3">Merchant</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Note</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-800 bg-stone-50">
          {transactions.map((t) => (
            <tr key={t.id} className="hover:bg-white/60">
              <td className="px-4 py-3 font-medium text-stone-800">
                <div className="flex items-center gap-2">
                  {t.isAnomaly && (
                    <AlertTriangle size={14} className="text-amber-600" />
                  )}
                  {t.merchant || t.description}
                </div>
              </td>
              <td className="px-4 py-3 text-stone-500">
                {t.category?.name ?? "—"}
              </td>
              <td
                className={cn(
                  "px-4 py-3 font-numeric font-semibold",
                  t.type === "INCOME" ? "text-emerald-600" : "text-red-600"
                )}
              >
                {t.type === "INCOME" ? "+" : "-"}
                {formatCurrency(t.amount)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    t.type === "INCOME"
                      ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-red-500/15 text-red-600"
                  )}
                >
                  {t.type}
                </span>
              </td>
              <td className="px-4 py-3 text-stone-500">{formatDate(t.date)}</td>
              <td className="px-4 py-3 text-stone-500">{t.note || "—"}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => onEdit(t)}
                    className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                    aria-label="Edit transaction"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => onDelete(t.id)}
                    className="rounded-md p-1.5 text-stone-500 hover:bg-red-600/15 hover:text-red-600"
                    aria-label="Delete transaction"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
