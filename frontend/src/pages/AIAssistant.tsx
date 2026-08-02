import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { FileBarChart } from "lucide-react";
import { accountService } from "../services/account.service";
import { aiService } from "../services/ai.service";
import { UploadCard } from "../components/ai/UploadCard";
import { InsightCard } from "../components/ai/InsightCard";
import { BudgetAdviceCard } from "../components/ai/BudgetAdviceCard";
import { FraudCard } from "../components/ai/FraudCard";
import { HealthCard } from "../components/ai/HealthCard";
import { CategoryTagsCard } from "../components/ai/CategoryTagsCard";
import { ChatBox } from "../components/ai/ChatBox";
import { Button } from "../components/ui/Button";
import type { Account } from "../types/account";
import type { AIUploadResult } from "../types/ai";

export const AIAssistant = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AIUploadResult | null>(null);

  useEffect(() => {
    accountService
      .getAll()
      .then(setAccounts)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load accounts"));
  }, []);

  const handleAnalyze = async (file: File, accountId: string) => {
    setIsAnalyzing(true);
    try {
      const data = await aiService.uploadStatement(file, accountId);
      setResult(data);
      localStorage.setItem("cashflow_last_ai_report", JSON.stringify(data));
      toast.success("Statement analyzed successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">AI Assistant</h1>
          <p className="text-sm text-stone-500">
            Your multi-agent finance copilot — upload, analyze, ask
          </p>
        </div>
        {result && (
          <Button variant="secondary" onClick={() => navigate("/ai-report")}>
            <FileBarChart size={16} />
            View Full Report
          </Button>
        )}
      </div>

      <UploadCard accounts={accounts} onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InsightCard data={result?.insights ?? null} />
        <BudgetAdviceCard data={result?.budget ?? null} />
        <FraudCard data={result?.fraud ?? null} />
        <HealthCard data={result?.health ?? null} />
        <CategoryTagsCard transactions={result?.transactions ?? []} />
      </div>

      <ChatBox />
    </div>
  );
};
