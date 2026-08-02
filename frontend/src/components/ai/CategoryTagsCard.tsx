import { Tags } from "lucide-react";
import { Card } from "../ui/Card";
import type { Transaction } from "../../types/transaction";

export const CategoryTagsCard = ({ transactions }: { transactions: Transaction[] }) => {
  const counts = transactions.reduce<Record<string, number>>((acc, t) => {
    const name = t.category?.name ?? "Uncategorized";
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(counts);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-stone-600">
        <Tags size={18} className="text-orange-600" />
        <h3 className="text-sm font-medium">Transaction Categories</h3>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-stone-500">Run an analysis to see categorized transactions.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {entries.map(([name, count]) => (
            <span
              key={name}
              className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600"
            >
              {name} · {count}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
};
