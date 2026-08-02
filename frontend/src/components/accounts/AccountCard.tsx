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
    <Card className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
          <Building2 size={20} />
        </div>
        <div>
          <p className="font-medium text-stone-900">{account.name}</p>
          <p className="text-sm text-stone-500">{account.bankName}</p>
        </div>
      </div>
      <div className="flex gap-1">
        <button
          onClick={onEdit}
          className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
          aria-label="Edit account"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={onDelete}
          className="rounded-md p-1.5 text-stone-500 hover:bg-red-600/15 hover:text-red-600"
          aria-label="Delete account"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </Card>
  );
};
