import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  UploadCloud,
  Layers,
  PiggyBank,
  Sparkles,
  Settings,
  LogOut,
  Menu,
  Box,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../utils/cn";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions & Import", icon: ArrowLeftRight },
  { to: "/accounts", label: "Accounts & Categories", icon: Layers },
  { to: "/budget", label: "Budget", icon: PiggyBank },
  { to: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings },
];

interface TopNavbarProps {
  onMenuClick: () => void;
}

export const TopNavbar = ({ onMenuClick }: TopNavbarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-stone-950 bg-stone-950">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <button
            onClick={onMenuClick}
            className="rounded-md p-1.5 text-stone-400 hover:bg-stone-800 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white">
              <Box size={17} />
            </span>
            <span className="font-display text-lg font-semibold text-white">
              CashFlow <span className="text-orange-500">AI</span>
            </span>
          </div>

          <nav className="hidden items-center gap-1 lg:flex">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-orange-600 text-white shadow-sm shadow-orange-900/50"
                      : "text-stone-400 hover:bg-stone-800 hover:text-white"
                  )
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-stone-400 sm:inline">
            {user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-stone-300 hover:bg-stone-800 hover:text-white"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
