import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { TopNavbar } from "../components/layout/TopNavbar";
import { MobileNav } from "../components/layout/MobileNav";
import { useAudit } from "../contexts/AuditContext";

export const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuditing } = useAudit();

  return (
    <div className="bg-ledger-grid min-h-screen bg-stone-100">
      <TopNavbar onMenuClick={() => setMobileOpen(true)} />
      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Global Background Audit Indicator Banner */}
      {isAuditing && (
        <div className="bg-stone-900 border-b border-orange-500/40 text-stone-200 px-4 py-2 text-xs sticky top-16 z-20 shadow-xs">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping" />
              <span className="flex items-center gap-1.5 font-medium text-white">
                <Sparkles size={14} className="text-orange-400" />
                Live Financial Audit running in the background...
              </span>
              <span className="text-stone-400 hidden sm:inline">
                Feel free to navigate anywhere &mdash; you&apos;ll be redirected when complete.
              </span>
            </div>
            <Link
              to="/ai-assistant"
              className="rounded-lg bg-orange-600 hover:bg-orange-500 text-white px-2.5 py-1 text-[11px] font-semibold transition-colors shrink-0 shadow-2xs"
            >
              Go to Copilot
            </Link>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
};
