import { Sparkles, RefreshCw, ShieldCheck, ArrowUpRight, Loader2, X, FileBarChart2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAudit } from "../contexts/AuditContext";
import { InsightCard } from "../components/ai/InsightCard";
import { BudgetAdviceCard } from "../components/ai/BudgetAdviceCard";
import { FraudCard } from "../components/ai/FraudCard";
import { HealthCard } from "../components/ai/HealthCard";
import { ChatBox } from "../components/ai/ChatBox";
import { Button } from "../components/ui/Button";

export const AIAssistant = () => {
  const { isAuditing, auditResult, lastAuditedAt, startAudit, clearAudit } = useAudit();

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
              AI Financial Copilot
            </h1>
            <span className="rounded-full bg-orange-100 dark:bg-orange-950/70 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/60">
              Live Data
            </span>
          </div>
          <p className="text-sm text-stone-500 dark:text-slate-400">
            Real-time diagnostics, anomaly checks, and conversational finance queries
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
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
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-orange-200 dark:border-orange-500/30 bg-orange-50/70 dark:bg-orange-950/30 p-4 text-orange-950 dark:text-orange-200 shadow-2xs animate-pulse">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 text-white shadow-xs shrink-0">
              <Loader2 size={18} className="animate-spin" />
            </div>
            <div>
              <p className="text-xs font-bold text-orange-900 dark:text-orange-200">
                Financial Audit is running in the background...
              </p>
              <p className="text-[11px] text-orange-800 dark:text-orange-300">
                Gemini agents are reviewing your real transactions. You can continue chatting below or visit other pages &mdash; we will bring you right back when results are ready!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SESSION AUDIT REPORT (Appears when audit is run, dismissible or resets on refresh/screen close) */}
      {auditResult && !isAuditing && (
        <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/90 dark:border-blue-900/40 bg-stone-50/50 dark:bg-[#111c35] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-200/70 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600 text-white">
                <FileBarChart2 size={15} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">Live Audit Report</h3>
                  <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    Active Session
                  </span>
                </div>
                {lastAuditedAt && (
                  <p className="text-[11px] text-stone-500 dark:text-slate-400">
                    Scanned at {lastAuditedAt} &bull; Clears when you refresh or close this screen
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={clearAudit}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-stone-500 dark:text-slate-400 hover:bg-stone-200/60 dark:hover:bg-slate-800 hover:text-stone-800 dark:hover:text-white transition-colors cursor-pointer"
              title="Close audit report"
            >
              <span>Close Report</span>
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-1">
            <HealthCard data={auditResult.health} />
            <InsightCard data={auditResult.insights} />
            <BudgetAdviceCard data={auditResult.budget} />
            <FraudCard data={auditResult.fraud} />
          </div>
        </div>
      )}

      {/* Audit Banner when no audit has been run in this session */}
      {!auditResult && !isAuditing && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-dashed border-stone-300 dark:border-blue-900/60 bg-white/70 dark:bg-[#111c35]/80 p-5 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-white">
                Ready for your live financial health scan?
              </p>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Analyzes your latest transactions to calculate savings efficiency, budget discipline, and detect leaks.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to="/transactions"
              className="text-xs font-medium text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white flex items-center gap-1"
            >
              View Transactions <ArrowUpRight size={13} />
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
