import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { aiService } from "../services/ai.service";
import type { LiveAuditResult } from "../types/ai";

interface AuditContextType {
  isAuditing: boolean;
  auditResult: LiveAuditResult | null;
  lastAuditedAt: string | null;
  startAudit: () => Promise<void>;
}

const AuditContext = createContext<AuditContextType | null>(null);

export const AuditProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<LiveAuditResult | null>(null);
  const [lastAuditedAt, setLastAuditedAt] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem("cashflow_live_audit");
    const cachedTime = localStorage.getItem("cashflow_live_audit_time");
    if (cached) {
      try {
        setAuditResult(JSON.parse(cached));
      } catch {
        // Ignore
      }
    }
    if (cachedTime) {
      setLastAuditedAt(cachedTime);
    }
  }, []);

  const startAudit = async () => {
    if (isAuditing) return;
    setIsAuditing(true);

    const toastId = toast.loading(
      "Financial audit is running in the background... You can continue browsing freely.",
      { duration: 8000 }
    );

    try {
      const data = await aiService.runLiveAudit();
      if (!data) {
        toast.error("No transactions found. Add transactions or import a statement first!", {
          id: toastId,
        });
        setIsAuditing(false);
        return;
      }

      setAuditResult(data);
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setLastAuditedAt(timeStr);
      localStorage.setItem("cashflow_live_audit", JSON.stringify(data));
      localStorage.setItem("cashflow_live_audit_time", timeStr);

      toast.success("Financial Health Audit complete! 🎉 Redirecting to your results...", {
        id: toastId,
        duration: 4000,
      });

      // Automatically bring user back to /ai-assistant to see their results
      navigate("/ai-assistant");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to run audit", {
        id: toastId,
      });
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <AuditContext.Provider
      value={{
        isAuditing,
        auditResult,
        lastAuditedAt,
        startAudit,
      }}
    >
      {children}
    </AuditContext.Provider>
  );
};

export const useAudit = () => {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error("useAudit must be used within an AuditProvider");
  }
  return context;
};
