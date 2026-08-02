import { Target } from "lucide-react";
import { Card } from "../ui/Card";
import type { BudgetAdviceResult } from "../../types/ai";

export const BudgetAdviceCard = ({ data }: { data: BudgetAdviceResult | null }) => {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-stone-600">
        <Target size={18} className="text-sky-600" />
        <h3 className="text-sm font-medium">Budget Advice</h3>
      </div>
      {data ? (
        <>
          <p className="text-sm font-medium text-stone-800">{data.status}</p>
          <p className="text-xs text-stone-500">{data.reason}</p>
          <p className="text-xs text-stone-500">{data.suggestion}</p>
        </>
      ) : (
        <p className="text-sm text-stone-500">Run an analysis to see budget advice.</p>
      )}
    </Card>
  );
};
