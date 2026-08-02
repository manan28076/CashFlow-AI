import { Lightbulb } from "lucide-react";
import { Card } from "../ui/Card";
import type { InsightResult } from "../../types/ai";

export const InsightCard = ({ data }: { data: InsightResult | null }) => {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-stone-600">
        <Lightbulb size={18} className="text-amber-600" />
        <h3 className="text-sm font-medium">Spending Insights</h3>
      </div>
      {data ? (
        <>
          <p className="text-sm text-stone-800">{data.summary}</p>
          <p className="text-xs text-stone-500">
            Top category: <span className="text-stone-600">{data.topCategory}</span>
          </p>
          <p className="text-xs text-stone-500">{data.recommendation}</p>
        </>
      ) : (
        <p className="text-sm text-stone-500">Run an analysis to see insights.</p>
      )}
    </Card>
  );
};
