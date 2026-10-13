import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Sparkles, RefreshCw, ShieldCheck, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { aiService } from "../services/ai.service";
import { InsightCard } from "../components/ai/InsightCard";
import { BudgetAdviceCard } from "../components/ai/BudgetAdviceCard";
import { FraudCard } from "../components/ai/FraudCard";
import { HealthCard } from "../components/ai/HealthCard";
import { ChatBox } from "../components/ai/ChatBox";
import { Button } from "../components/ui/Button";
import type { LiveAuditResult } from "../types/ai";

export const AIAssistant = () => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<LiveAuditResult | null>(null);
  const [lastAuditedAt, setLastAuditedAt] = useState<string | null>(null);

  // Load cached audit if available
  useEffect(() => {
    const cached = localStorage.getItem("cashflow_live_audit");
    const cachedTime = localStorage.getItem("cashflow_live_audit_time");
    if (cached) {
      try {
        setAuditResult(JSON.parse(cached));
      } catch {
        // Ignore parse error
      }
    }
    if (cachedTime) {
      setLastAuditedAt(cachedTime);
    }
  }, []);

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const data = await aiService.runLiveAudit();
      if (!data) {
        toast.error("No transactions found. Add transactions or import a statement first!");
        return;
      }
      setAuditResult(data);
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setLastAuditedAt(timeStr);
      localStorage.setItem("cashflow_live_audit", JSON.stringify(data));
      localStorage.setItem("cashflow_live_audit_time", timeStr);
      toast.success("Live financial audit completed!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to run audit");
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              AI Financial Copilot
            </h1>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
              Live Data
            </span>
          </div>
          <p className="text-sm text-stone-500">
            Real-time diagnostics, anomaly checks, and conversational finance queries
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {lastAuditedAt && (
            <span className="text-xs text-stone-400 hidden md:inline">
              Audited at {lastAuditedAt}
            </span>
          )}
          <Button
            onClick={handleRunAudit}
            isLoading={isAuditing}
            className="gap-2 font-medium bg-orange-600 hover:bg-orange-700 shadow-xs"
          >
            {isAuditing ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <Sparkles size={15} />
            )}
            <span>{auditResult ? "Re-run Live Audit" : "Run Live Financial Audit"}</span>
          </Button>
        </div>
      </div>

      {/* Intelligence Grid (4 Core Real Cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HealthCard data={auditResult?.health ?? null} />
        <InsightCard data={auditResult?.insights ?? null} />
        <BudgetAdviceCard data={auditResult?.budget ?? null} />
        <FraudCard data={auditResult?.fraud ?? null} />
      </div>

      {/* Audit Banner if never audited */}
      {!auditResult && !isAuditing && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-dashed border-stone-300 bg-white/70 p-5 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900">
                Ready for your live financial health scan?
              </p>
              <p className="text-xs text-stone-500">
                Analyzes your latest 50 transactions to calculate savings efficiency, budget discipline, and detect leaks.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to="/import"
              className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1"
            >
              Import more data <ArrowUpRight size={13} />
            </Link>
            <Button
              onClick={handleRunAudit}
              variant="secondary"
              className="gap-1.5 text-xs font-semibold"
            >
              <Sparkles size={14} className="text-orange-600" />
              Scan Now
            </Button>
          </div>
        </div>
      )}

      {/* Interactive AI Chat Copilot (Full width) */}
      <ChatBox />
    </div>
  );
};
