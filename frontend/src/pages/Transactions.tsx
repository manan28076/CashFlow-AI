import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { transactionService } from "../services/transaction.service";
import { accountService } from "../services/account.service";
import { categoryService } from "../services/category.service";
import { TransactionTable } from "../components/transactions/TransactionTable";
import { TransactionFilters } from "../components/transactions/TransactionFilters";
import { TransactionFormModal } from "../components/transactions/TransactionFormModal";
import { Pagination } from "../components/transactions/Pagination";
import { Button } from "../components/ui/Button";
import { useDebounce } from "../hooks/useDebounce";
import type {
  CreateTransactionPayload,
  Transaction,
  TransactionQueryParams,
} from "../types/transaction";
import type { Account } from "../types/account";
import type { Category } from "../types/category";

export const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState<TransactionQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "date",
    sortOrder: "desc",
  });

  const debouncedSearch = useDebounce(filters.search, 400);

  const loadMeta = async () => {
    try {
      const [accs, cats] = await Promise.all([
        accountService.getAll(),
        categoryService.getAll(),
      ]);
      setAccounts(accs);
      setCategories(cats);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load form data");
    }
  };

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await transactionService.getAll({
        ...filters,
        search: debouncedSearch,
      });
      setTransactions(data.transactions);
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    filters.categoryId,
    filters.type,
    filters.sortBy,
    filters.sortOrder,
    filters.page,
  ]);

  const handleAdd = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setIsModalOpen(true);
  };

  const handleSubmit = async (payload: CreateTransactionPayload) => {
    try {
      if (editingTransaction) {
        await transactionService.update(editingTransaction.id, payload);
        toast.success("Transaction updated");
      } else {
        await transactionService.create(payload);
        toast.success("Transaction added");
      }
      await loadTransactions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      await transactionService.remove(id);
      toast.success("Transaction deleted");
      await loadTransactions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete transaction");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Transactions</h1>
          <p className="text-sm text-stone-500">All your income and expenses in one place</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={16} />
          Add Transaction
        </Button>
      </div>

      <TransactionFilters filters={filters} onChange={setFilters} categories={categories} />

      <TransactionTable
        transactions={transactions}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Pagination
        page={filters.page ?? 1}
        totalPages={totalPages}
        onPageChange={(page) => setFilters({ ...filters, page })}
      />

      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        accounts={accounts}
        categories={categories}
        initialData={editingTransaction}
      />
    </div>
  );
};
