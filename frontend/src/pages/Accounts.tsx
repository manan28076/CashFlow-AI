import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Wallet } from "lucide-react";
import { accountService } from "../services/account.service";
import { AccountCard } from "../components/accounts/AccountCard";
import { AccountFormModal } from "../components/accounts/AccountFormModal";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import type { Account, CreateAccountPayload } from "../types/account";

export const Accounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const data = await accountService.getAll();
      setAccounts(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleAdd = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleSubmit = async (payload: CreateAccountPayload) => {
    try {
      if (editingAccount) {
        await accountService.update(editingAccount.id, payload);
        toast.success("Account updated");
      } else {
        await accountService.create(payload);
        toast.success("Account added");
      }
      await loadAccounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this account? This cannot be undone.")) return;
    try {
      await accountService.remove(id);
      toast.success("Account deleted");
      await loadAccounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete account");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Accounts</h1>
          <p className="text-sm text-stone-500">Manage your linked bank accounts</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={16} />
          Add Account
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={<Wallet size={32} className="text-stone-600" />}
          title="No accounts yet"
          description="Add a bank account to start tracking transactions"
          action={<Button onClick={handleAdd}>Add Account</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={() => handleEdit(account)}
              onDelete={() => handleDelete(account.id)}
            />
          ))}
        </div>
      )}

      <AccountFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingAccount}
      />
    </div>
  );
};
