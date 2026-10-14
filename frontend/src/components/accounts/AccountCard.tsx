import { Building2, Pencil, Trash2, Cpu, Wifi, CheckCircle2 } from "lucide-react";
import type { Account } from "../../types/account";
import { cn } from "../../utils/cn";

interface AccountCardProps {
  account: Account;
  onEdit: () => void;
  onDelete: () => void;
}

const getBankDetails = (bankName: string) => {
  const norm = (bankName || "").toLowerCase();

  if (norm.includes("hdfc")) {
    return {
      name: "HDFC Bank",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      accent: "from-blue-600 via-indigo-600 to-blue-800",
      cardBorder: "hover:border-blue-300",
      shadowHover: "hover:shadow-blue-500/10",
      bgWash: "hover:from-blue-50/40 hover:via-white hover:to-indigo-50/20",
      iconBg: "bg-blue-50 text-blue-700 border-blue-200/60",
    };
  }

  if (norm.includes("sbi") || norm.includes("state bank")) {
    return {
      name: "State Bank of India",
      badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
      accent: "from-sky-500 via-cyan-600 to-blue-600",
      cardBorder: "hover:border-cyan-300",
      shadowHover: "hover:shadow-cyan-500/10",
      bgWash: "hover:from-cyan-50/40 hover:via-white hover:to-sky-50/20",
      iconBg: "bg-cyan-50 text-cyan-700 border-cyan-200/60",
    };
  }

  if (norm.includes("icici")) {
    return {
      name: "ICICI Bank",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      accent: "from-amber-500 via-orange-600 to-rose-600",
      cardBorder: "hover:border-amber-300",
      shadowHover: "hover:shadow-amber-500/10",
      bgWash: "hover:from-amber-50/40 hover:via-white hover:to-orange-50/20",
      iconBg: "bg-amber-50 text-amber-700 border-amber-200/60",
    };
  }

  if (norm.includes("axis")) {
    return {
      name: "Axis Bank",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
      accent: "from-rose-600 via-pink-700 to-purple-800",
      cardBorder: "hover:border-rose-300",
      shadowHover: "hover:shadow-rose-500/10",
      bgWash: "hover:from-rose-50/40 hover:via-white hover:to-pink-50/20",
      iconBg: "bg-rose-50 text-rose-700 border-rose-200/60",
    };
  }

  if (norm.includes("kotak")) {
    return {
      name: "Kotak Mahindra",
      badgeColor: "bg-red-100 text-red-800 border-red-200",
      accent: "from-red-600 to-rose-700",
      cardBorder: "hover:border-red-300",
      shadowHover: "hover:shadow-red-500/10",
      bgWash: "hover:from-red-50/40 hover:via-white hover:to-rose-50/20",
      iconBg: "bg-red-50 text-red-700 border-red-200/60",
    };
  }

  return {
    name: bankName || "Checking / Wallet",
    badgeColor: "bg-orange-100 text-orange-800 border-orange-200",
    accent: "from-orange-500 via-amber-500 to-yellow-600",
    cardBorder: "hover:border-orange-300",
    shadowHover: "hover:shadow-orange-500/10",
    bgWash: "hover:from-orange-50/40 hover:via-white hover:to-amber-50/20",
    iconBg: "bg-orange-50 text-orange-600 border-orange-200/60",
  };
};

export const AccountCard = ({ account, onEdit, onDelete }: AccountCardProps) => {
  const bank = getBankDetails(account.bankName);
  const maskedId = account.id ? `•••• ${account.id.slice(-4).toUpperCase()}` : "•••• 4092";

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1.5 hover:shadow-xl hover:scale-[1.015]",
        bank.cardBorder,
        bank.shadowHover,
        `hover:bg-gradient-to-br ${bank.bgWash}`
      )}
    >
      {/* Top Accent Stripe - Expands on hover */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r transition-all duration-300 group-hover:h-1.5",
          bank.accent
        )}
      />

      <div>
        {/* Card Header: Monogram/Icon + Bank Badge + Action Buttons */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border shadow-2xs transition-all duration-300 group-hover:rotate-6 group-hover:scale-110",
                bank.iconBg
              )}
            >
              <Building2 size={20} />
            </div>

            <div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border shadow-2xs",
                  bank.badgeColor
                )}
              >
                {bank.name}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="rounded-lg p-1.5 text-stone-400 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 cursor-pointer hover:scale-110"
              aria-label="Edit account"
              title="Edit account"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={onDelete}
              className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200 cursor-pointer hover:scale-110"
              aria-label="Delete account"
              title="Delete account"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Account Title & Metal Card Graphic */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900 tracking-tight group-hover:text-stone-950 transition-colors">
              {account.name}
            </h3>
            <p className="mt-0.5 text-xs text-stone-500 font-mono tracking-wider">
              {maskedId}
            </p>
          </div>

          {/* Metallic EMV Chip & Contactless Wave */}
          <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
            <div className="flex h-6 w-8 items-center justify-center rounded bg-gradient-to-br from-amber-200 via-yellow-300 to-amber-400 border border-amber-400 shadow-2xs">
              <Cpu size={14} className="text-amber-800 opacity-90" />
            </div>
            <Wifi size={14} className="rotate-90 text-stone-400 group-hover:text-stone-700 transition-colors" />
          </div>
        </div>
      </div>

      {/* Footer: Live Sync Status */}
      <div className="mt-4 flex items-center justify-between border-t border-stone-100/90 pt-3 text-[11px]">
        <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active & Synced</span>
        </div>
        <span className="text-stone-400 font-mono text-[10px]">Primary Ledger</span>
      </div>
    </div>
  );
};
