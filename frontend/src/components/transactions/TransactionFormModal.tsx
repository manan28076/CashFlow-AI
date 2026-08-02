import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import type {
  CreateTransactionPayload,
  Transaction,
} from "../../types/transaction";
import type { Account } from "../../types/account";
import type { Category } from "../../types/category";

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTransactionPayload) => Promise<void>;
  accounts: Account[];
  categories: Category[];
  initialData?: Transaction | null;
}

const emptyForm: CreateTransactionPayload = {
  accountId: "",
  categoryId: "",
  amount: 0,
  type: "EXPENSE",
  merchant: "",
  note: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
};

export const TransactionFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  accounts,
  categories,
  initialData,
}: TransactionFormModalProps) => {
  const [form, setForm] = useState<CreateTransactionPayload>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(
        initialData
          ? {
              accountId: initialData.accountId,
              categoryId: initialData.categoryId,
              amount: initialData.amount,
              type: initialData.type,
              merchant: initialData.merchant ?? "",
              note: initialData.note ?? "",
              description: initialData.description,
              date: initialData.date.slice(0, 10),
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
      title={initialData ? "Edit Transaction" : "Add Transaction"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="description"
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="merchant"
            label="Merchant"
            value={form.merchant}
            onChange={(e) => setForm({ ...form, merchant: e.target.value })}
          />
          <Input
            id="amount"
            label="Amount"
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) =>
              setForm({ ...form, amount: Number(e.target.value) })
            }
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select
            id="type"
            label="Type"
            value={form.type}
            onChange={(e) =>
              setForm({
                ...form,
                type: e.target.value as CreateTransactionPayload["type"],
              })
            }
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </Select>
          <Input
            id="date"
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select
            id="accountId"
            label="Account"
            value={form.accountId}
            onChange={(e) => setForm({ ...form, accountId: e.target.value })}
            required
          >
            <option value="">Select account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
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
        </div>
        <Input
          id="note"
          label="Note"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
        <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
          {initialData ? "Save Changes" : "Add Transaction"}
        </Button>
      </form>
    </Modal>
  );
};
