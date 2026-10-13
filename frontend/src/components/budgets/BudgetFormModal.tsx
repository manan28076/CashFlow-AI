import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import type { Budget, CreateBudgetPayload } from "../../types/budget";
import type { Category } from "../../types/category";
import { monthName } from "../../utils/formatters";

interface BudgetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateBudgetPayload, repeatMonths?: number) => Promise<void>;
  categories: Category[];
  initialData?: Budget | null;
  defaultCategoryId?: string;
}

const now = new Date();

export const BudgetFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  initialData,
  defaultCategoryId,
}: BudgetFormModalProps) => {
  const [form, setForm] = useState<CreateBudgetPayload>({
    categoryId: defaultCategoryId || "",
    amount: 0,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const [repeatMonths, setRepeatMonths] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          categoryId: initialData.categoryId,
          amount: initialData.amount || 0,
          month: initialData.month,
          year: initialData.year,
        });
        setRepeatMonths(1);
      } else {
        setForm({
          categoryId: defaultCategoryId || (categories[0]?.id ?? ""),
          amount: 0,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        });
        setRepeatMonths(1);
      }
    }
  }, [isOpen, initialData, defaultCategoryId, categories]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(form, repeatMonths);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const targetCategory = categories.find((c) => c.id === form.categoryId);
  const isOverall = targetCategory?.name === "Overall";

  const expenseCategories = categories.filter(
    (c) => c.name !== "Salary" && c.name !== "Freelance"
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isOverall
          ? initialData?.amount
            ? "Edit Overall Monthly Budget"
            : "Set Overall Monthly Budget"
          : initialData?.amount
          ? `Edit ${targetCategory?.name || ""} Budget`
          : `Set ${targetCategory?.name || ""} Budget Limit`
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isOverall ? (
          <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 text-xs text-indigo-900">
            <p className="font-semibold text-indigo-950">🎯 Overall Monthly Budget Limit</p>
            <p className="mt-0.5 text-indigo-700">
              This sets a single overall spending target for all your expenses combined this month, without needing to configure individual categories.
            </p>
          </div>
        ) : (
          <Select
            id="categoryId"
            label="Category"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            required
          >
            <option value="">Select category</option>
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name === "Overall" ? "🎯 Overall Monthly Budget (All Expenses)" : c.name}
              </option>
            ))}
          </Select>
        )}

        <Input
          id="amount"
          label={isOverall ? "Overall Monthly Limit (₹)" : "Category Monthly Limit (₹)"}
          type="number"
          step="1"
          placeholder={isOverall ? "e.g. 50000" : "e.g. 10000"}
          value={form.amount || ""}
          onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            id="month"
            label="Month"
            value={form.month}
            onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i + 1}>
                {monthName(i + 1)}
              </option>
            ))}
          </Select>
          <Input
            id="year"
            label="Year"
            type="number"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
          />
        </div>

        {!initialData && (
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Apply to Multiple Months
            </label>
            <Select
              id="repeatMonths"
              value={repeatMonths}
              onChange={(e) => setRepeatMonths(Number(e.target.value))}
            >
              <option value={1}>This month only</option>
              <option value={3}>Next 3 months</option>
              <option value={6}>Next 6 months (Half Year)</option>
              <option value={12}>Full Year (12 months)</option>
            </Select>
            <p className="mt-1 text-[11px] text-stone-500">
              Saves time by creating budget limits across upcoming months automatically.
            </p>
          </div>
        )}

        <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
          {initialData?.amount
            ? "Save Changes"
            : isOverall
            ? "Save Overall Monthly Budget"
            : repeatMonths > 1
            ? `Create for ${repeatMonths} Months`
            : "Save Budget Limit"}
        </Button>
      </form>
    </Modal>
  );
};
