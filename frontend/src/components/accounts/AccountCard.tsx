import { Building2, Pencil, Trash2 } from "lucide-react";
import { Card } from "../ui/Card";
import type { Account } from "../../types/account";

interface AccountCardProps {
  account: Account;
  onEdit: () => void;
  onDelete: () => void;
}

export const AccountCard = ({ account, onEdit, onDelete }: AccountCardProps) => {
  return (
    <Card className="flex items-center justify-between gap-3 border border-stone-200/90 p-4 shadow-2xs hover:shadow-xs transition-shadow">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 shrink-0">
          <Building2 size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-900">{account.name}</p>
          <p className="text-xs text-stone-500">{account.bankName}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-800 transition-colors cursor-pointer"
          aria-label="Edit account"
          title="Edit account"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
          aria-label="Delete account"
          title="Delete account"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </Card>
  );
};
