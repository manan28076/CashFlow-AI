import { useEffect, useState } from "react";
import { FileWarning } from "lucide-react";
import { InsightCard } from "../components/ai/InsightCard";
import { BudgetAdviceCard } from "../components/ai/BudgetAdviceCard";
import { FraudCard } from "../components/ai/FraudCard";
import { HealthCard } from "../components/ai/HealthCard";
import { CategoryTagsCard } from "../components/ai/CategoryTagsCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Card } from "../components/ui/Card";
import type { AIUploadResult } from "../types/ai";

export const AIReport = () => {
  const [report, setReport] = useState<AIUploadResult | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("cashflow_last_ai_report");
    if (stored) {
      setReport(JSON.parse(stored));
    }
  }, []);

  if (!report) {
    return (
      <EmptyState
        icon={<FileWarning size={32} className="text-stone-600" />}
        title="No report yet"
        description="Run an analysis from the AI Assistant page to generate a report"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">AI Report</h1>
        <p className="text-sm text-stone-500">Full breakdown of your latest statement analysis</p>
      </div>

      <Card>
        <h3 className="mb-2 text-sm font-medium text-stone-600">Overall Summary</h3>
        <p className="text-sm text-stone-500">
          {report.insights?.summary ?? "No summary available for this analysis."}
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InsightCard data={report.insights} />
        <BudgetAdviceCard data={report.budget} />
        <FraudCard data={report.fraud} />
        <HealthCard data={report.health} />
      </div>

      <CategoryTagsCard transactions={report.transactions} />
    </div>
  );
};
