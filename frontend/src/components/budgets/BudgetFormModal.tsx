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
  onSubmit: (payload: CreateBudgetPayload) => Promise<void>;
  categories: Category[];
  initialData?: Budget | null;
}

const now = new Date();

const emptyForm: CreateBudgetPayload = {
  categoryId: "",
  amount: 0,
  month: now.getMonth() + 1,
  year: now.getFullYear(),
};

export const BudgetFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  initialData,
}: BudgetFormModalProps) => {
  const [form, setForm] = useState<CreateBudgetPayload>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(
        initialData
          ? {
              categoryId: initialData.categoryId,
              amount: initialData.amount,
              month: initialData.month,
              year: initialData.year,
            }
          : emptyForm
      );
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Budget" : "Add Budget"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select
          id="categoryId"
          label="Category"
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          required
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Input
          id="amount"
          label="Monthly Limit"
          type="number"
          step="0.01"
          value={form.amount}
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
        <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
          {initialData ? "Save Changes" : "Add Budget"}
        </Button>
      </form>
    </Modal>
  );
};
