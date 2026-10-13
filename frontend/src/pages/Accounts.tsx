import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Wallet, Tag, Building2, Layers } from "lucide-react";
import { accountService } from "../services/account.service";
import { categoryService } from "../services/category.service";
import { AccountCard } from "../components/accounts/AccountCard";
import { AccountFormModal } from "../components/accounts/AccountFormModal";
import { CategoryListItem } from "../components/categories/CategoryListItem";
import { CategoryFormModal } from "../components/categories/CategoryFormModal";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Card } from "../components/ui/Card";
import { cn } from "../utils/cn";
import type { Account, CreateAccountPayload } from "../types/account";
import type { Category, CreateCategoryPayload } from "../types/category";

export const Accounts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get("tab") as "all" | "accounts" | "categories") || "all";
  const [activeTab, setActiveTab] = useState<"all" | "accounts" | "categories">(currentTab);

  useEffect(() => {
    const tab = (searchParams.get("tab") as "all" | "accounts" | "categories") || "all";
    setActiveTab(tab);
  }, [searchParams]);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Accounts modal state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Categories modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [accData, catData] = await Promise.all([
        accountService.getAll(),
        categoryService.getAll(),
      ]);
      setAccounts(accData);
      setCategories(catData.filter((c) => c.name !== "Overall"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (tab: "all" | "accounts" | "categories") => {
    setActiveTab(tab);
    if (tab === "all") {
      searchParams.delete("tab");
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  };

  // Account operations
  const handleAddAccount = () => {
    setEditingAccount(null);
    setIsAccountModalOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setIsAccountModalOpen(true);
  };

  const handleSubmitAccount = async (payload: CreateAccountPayload) => {
    try {
      if (editingAccount) {
        await accountService.update(editingAccount.id, payload);
        toast.success("Account updated");
      } else {
        await accountService.create(payload);
        toast.success("Account added");
      }
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Delete this account? This cannot be undone.")) return;
    try {
      await accountService.remove(id);
      toast.success("Account deleted");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete account");
    }
  };

  // Category operations
  const handleAddCategory = () => {
    setIsCategoryModalOpen(true);
  };

  const handleSubmitCategory = async (payload: CreateCategoryPayload) => {
    try {
      await categoryService.create(payload);
      toast.success("Category added");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await categoryService.remove(id);
      toast.success("Category deleted");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  const showAccounts = activeTab === "all" || activeTab === "accounts";
  const showCategories = activeTab === "all" || activeTab === "categories";

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Accounts & Categories
          </h1>
          <p className="text-sm text-stone-500">
            Manage your linked bank accounts and spending categories in one place
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            onClick={handleAddAccount}
            variant="secondary"
            className="gap-2 border-stone-300 text-stone-700 hover:bg-stone-100 font-medium"
          >
            <Plus size={16} />
            Add Account
          </Button>
          <Button onClick={handleAddCategory} className="gap-2 font-medium">
            <Plus size={16} />
            Add Category
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
        <button
          onClick={() => handleTabChange("all")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
            activeTab === "all"
              ? "bg-stone-900 text-white shadow-xs"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          )}
        >
          <Layers size={14} />
          All
        </button>
        <button
          onClick={() => handleTabChange("accounts")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
            activeTab === "accounts"
              ? "bg-stone-900 text-white shadow-xs"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          )}
        >
          <Wallet size={14} />
          Bank Accounts ({accounts.length})
        </button>
        <button
          onClick={() => handleTabChange("categories")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
            activeTab === "categories"
              ? "bg-stone-900 text-white shadow-xs"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          )}
        >
          <Tag size={14} />
          Categories ({categories.length})
        </button>
      </div>

      {/* SECTION 1: BANK ACCOUNTS */}
      {showAccounts && (
        <Card className="flex flex-col gap-4 border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Building2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-stone-900">Bank Accounts</h2>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                    {accounts.length} linked
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Accounts used to track transactions, statements, and balances
                </p>
              </div>
            </div>
            <Button
              onClick={handleAddAccount}
              variant="secondary"
              className="gap-1.5 text-xs font-medium self-start sm:self-auto"
            >
              <Plus size={14} />
              Add Account
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <EmptyState
              icon={<Wallet size={32} className="text-stone-400" />}
              title="No accounts linked yet"
              description="Add a bank account or wallet to start tracking transactions and statement imports."
              action={
                <Button onClick={handleAddAccount} className="gap-2">
                  <Plus size={15} />
                  Add First Account
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-1">
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={() => handleEditAccount(account)}
                  onDelete={() => handleDeleteAccount(account.id)}
                />
              ))}
            </div>
          )}
        </Card>
      )}

      {/* SECTION 2: CATEGORIES */}
      {showCategories && (
        <Card className="flex flex-col gap-4 border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Tag size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-stone-900">Spending & Income Categories</h2>
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700">
                    {categories.length} categories
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Labels used to classify your transactions for budgeting, analytics, and AI reports
                </p>
              </div>
            </div>
            <Button
              onClick={handleAddCategory}
              variant="secondary"
              className="gap-1.5 text-xs font-medium self-start sm:self-auto"
            >
              <Plus size={14} />
              Add Category
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <EmptyState
              icon={<Tag size={32} className="text-stone-400" />}
              title="No categories yet"
              description="Add custom categories to organize your expenses and incomes."
              action={
                <Button onClick={handleAddCategory} className="gap-2">
                  <Plus size={15} />
                  Add First Category
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-1">
              {categories.map((category) => (
                <CategoryListItem
                  key={category.id}
                  category={category}
                  onDelete={() => handleDeleteCategory(category.id)}
                />
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Account Modal */}
      <AccountFormModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSubmit={handleSubmitAccount}
        initialData={editingAccount}
      />

      {/* Category Modal */}
      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleSubmitCategory}
      />
    </div>
  );
};
