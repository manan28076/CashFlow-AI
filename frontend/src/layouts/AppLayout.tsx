import { useState } from "react";
import { Outlet } from "react-router-dom";
import { TopNavbar } from "../components/layout/TopNavbar";
import { MobileNav } from "../components/layout/MobileNav";

export const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="bg-ledger-grid min-h-screen bg-stone-100">
      <TopNavbar onMenuClick={() => setMobileOpen(true)} />
      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className="mx-auto max-w-7xl p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
};
