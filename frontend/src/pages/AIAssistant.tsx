import { Sparkles, RefreshCw, ShieldCheck, ArrowUpRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAudit } from "../contexts/AuditContext";
import { InsightCard } from "../components/ai/InsightCard";
import { BudgetAdviceCard } from "../components/ai/BudgetAdviceCard";
import { FraudCard } from "../components/ai/FraudCard";
import { HealthCard } from "../components/ai/HealthCard";
import { ChatBox } from "../components/ai/ChatBox";
import { Button } from "../components/ui/Button";

export const AIAssistant = () => {
  const { isAuditing, auditResult, lastAuditedAt, startAudit } = useAudit();

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
          {lastAuditedAt && !isAuditing && (
            <span className="text-xs text-stone-400 hidden md:inline">
              Audited at {lastAuditedAt}
            </span>
          )}
          <Button
            onClick={startAudit}
            disabled={isAuditing}
            className="gap-2 font-medium bg-orange-600 hover:bg-orange-700 shadow-xs"
          >
            {isAuditing ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Auditing in Background...</span>
              </>
            ) : (
              <>
                <Sparkles size={15} />
                <span>{auditResult ? "Re-run Live Audit" : "Run Live Financial Audit"}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Active Background Audit Notification on page */}
      {isAuditing && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-orange-50/70 p-4 text-orange-950 shadow-2xs animate-pulse">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 text-white shadow-xs shrink-0">
              <Loader2 size={18} className="animate-spin" />
            </div>
            <div>
              <p className="text-xs font-bold text-orange-900">
                Financial Audit is running in the background...
              </p>
              <p className="text-[11px] text-orange-800">
                Gemini agents are reviewing your real transactions. You can continue chatting below or visit other pages &mdash; we will bring you right back when results are ready!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Intelligence Grid (4 Core Real Cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HealthCard data={auditResult?.health ?? null} />
        <InsightCard data={auditResult?.insights ?? null} />
        <BudgetAdviceCard data={auditResult?.budget ?? null} />
        <FraudCard data={auditResult?.fraud ?? null} />
      </div>

      {/* Audit Banner if never audited & not currently auditing */}
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
                Analyzes your latest transactions to calculate savings efficiency, budget discipline, and detect leaks.
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
              onClick={startAudit}
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
