import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, ArrowLeftRight } from "lucide-react";
import { transactionService } from "../services/transaction.service";
import { accountService } from "../services/account.service";
import { categoryService } from "../services/category.service";
import { StatementImportSection } from "../components/transactions/StatementImportSection";
import { TransactionTable } from "../components/transactions/TransactionTable";
import { TransactionFilters } from "../components/transactions/TransactionFilters";
import { TransactionFormModal } from "../components/transactions/TransactionFormModal";
import { DuplicateManagerBanner } from "../components/transactions/DuplicateManagerBanner";
import { Pagination } from "../components/transactions/Pagination";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useDebounce } from "../hooks/useDebounce";
import type {
  CreateTransactionPayload,
  DuplicateScanResult,
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
  const [duplicates, setDuplicates] = useState<DuplicateScanResult | null>(null);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

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

  const loadDuplicates = async () => {
    setIsCheckingDuplicates(true);
    try {
      const data = await transactionService.getDuplicates();
      setDuplicates(data);
    } catch {
      // non-critical error, fail gracefully
    } finally {
      setIsCheckingDuplicates(false);
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
    loadDuplicates();
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
    if (editingTransaction) {
      await transactionService.update(editingTransaction.id, payload);
      toast.success("Transaction updated");
    } else {
      await transactionService.create(payload);
      toast.success("Transaction added");
    }
    await loadTransactions();
    await loadDuplicates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      await transactionService.remove(id);
      toast.success("Transaction deleted");
      await loadTransactions();
      await loadDuplicates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete transaction");
    }
  };

  const currentPage = filters.page ?? 1;

  return (
    <div className="flex flex-col gap-6">
      {/* DUPLICATE TRANSACTIONS BANNER & RESOLVER */}
      <DuplicateManagerBanner
        duplicates={duplicates}
        onResolved={() => {
          loadTransactions();
          loadDuplicates();
        }}
        isLoading={isCheckingDuplicates}
      />

      {/* SECTION 1 (UPPER HALF / TOP): IMPORT STATEMENT (on first page) */}
      {currentPage === 1 && (
        <StatementImportSection
          onImportSuccess={() => {
            loadTransactions();
            loadDuplicates();
          }}
        />
      )}

      {/* SECTION 2 (LOWER HALF / BELOW IT): TRANSACTIONS MANAGEMENT */}
      <Card className="flex flex-col gap-5 border border-stone-200/90 dark:border-blue-900/40 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 shadow-2xs">
              <ArrowLeftRight size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white">All Transactions</h2>
                <span className="rounded-full bg-stone-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-stone-600 dark:text-slate-300">
                  Page {currentPage} of {totalPages || 1}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Filter, search, review, and manually manage income and expenses
              </p>
            </div>
          </div>

          <Button onClick={handleAdd} className="gap-2 font-medium self-start sm:self-auto">
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
          page={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setFilters({ ...filters, page })}
        />
      </Card>

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
