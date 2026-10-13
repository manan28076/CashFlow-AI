import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
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
  const [duplicateWarning, setDuplicateWarning] = useState<{
    message: string;
    details?: any;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDuplicateWarning(null);
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

  const handleSubmit = async (e: FormEvent, forceAllowDuplicate = false) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ ...form, allowDuplicate: forceAllowDuplicate });
      setDuplicateWarning(null);
      onClose();
    } catch (err: any) {
      if (err?.isDuplicate || err?.status === 409) {
        setDuplicateWarning({
          message:
            err.message ||
            "An identical transaction already exists on this date with the same amount and description.",
          details: err.duplicateDetails,
        });
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to save transaction");
      }
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

        {duplicateWarning && (
          <div className="rounded-xl border border-amber-300 bg-amber-50/95 p-3.5 text-amber-900 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              <div className="flex-1 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 text-sm">
                    Duplicate Detected!
                  </span>
                  <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                    Matches existing
                  </span>
                </div>
                <p className="text-amber-900 leading-relaxed">
                  {duplicateWarning.message}
                </p>
                <div className="rounded-lg bg-white/80 p-2 border border-amber-200/60 text-[11px] text-stone-700 space-y-0.5">
                  <div><strong>Amount:</strong> ₹{Number(form.amount).toLocaleString("en-IN")}</div>
                  <div><strong>Date:</strong> {form.date}</div>
                  <div><strong>Description:</strong> {form.description}</div>
                  {form.merchant && <div><strong>Merchant:</strong> {form.merchant}</div>}
                </div>
                <p className="font-semibold text-amber-950">
                  Is this a separate transaction or did you accidentally submit twice?
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setDuplicateWarning(null);
                      onClose();
                    }}
                    className="text-xs bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 py-1.5 px-3"
                  >
                    Cancel / Same One
                  </Button>
                  <Button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    isLoading={isSubmitting}
                    className="text-xs bg-amber-600 hover:bg-amber-700 text-white py-1.5 px-3"
                  >
                    Yes, Add as New Transaction
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
          {initialData ? "Save Changes" : "Add Transaction"}
        </Button>
      </form>
    </Modal>
  );
};
