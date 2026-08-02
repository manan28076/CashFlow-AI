import { HeartPulse } from "lucide-react";
import { Card } from "../ui/Card";
import type { HealthResult } from "../../types/ai";

export const HealthCard = ({ data }: { data: HealthResult | null }) => {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-stone-600">
        <HeartPulse size={18} className="text-pink-600" />
        <h3 className="text-sm font-medium">Financial Health Score</h3>
      </div>
      {data ? (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-stone-900">{data.score}</span>
            <span className="text-sm text-stone-500">/ 100 · {data.grade}</span>
          </div>
          <p className="text-xs text-stone-500">{data.reason}</p>
          <p className="text-xs text-stone-500">{data.advice}</p>
        </>
      ) : (
        <p className="text-sm text-stone-500">Run an analysis to see your health score.</p>
      )}
    </Card>
  );
};
