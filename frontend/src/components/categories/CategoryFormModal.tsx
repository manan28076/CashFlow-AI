import { useState, type FormEvent } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";
import type { CreateCategoryPayload } from "../../types/category";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateCategoryPayload) => Promise<void>;
}

export const CategoryFormModal = ({ isOpen, onClose, onSubmit }: CategoryFormModalProps) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), type });
      setName("");
      setType("EXPENSE");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Category">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Category Type Selector */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-stone-700">
            Category Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("EXPENSE")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all cursor-pointer",
                type === "EXPENSE"
                  ? "border-rose-300 bg-rose-50 text-rose-700 shadow-xs"
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              )}
            >
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-white text-[10px]",
                  type === "EXPENSE" ? "bg-rose-600" : "bg-stone-300"
                )}
              >
                <ArrowDownRight size={12} />
              </div>
              Expense
            </button>

            <button
              type="button"
              onClick={() => setType("INCOME")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all cursor-pointer",
                type === "INCOME"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-xs"
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              )}
            >
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-white text-[10px]",
                  type === "INCOME" ? "bg-emerald-600" : "bg-stone-300"
                )}
              >
                <ArrowUpRight size={12} />
              </div>
              Income
            </button>
          </div>
        </div>

        {/* Category Name Input */}
        <Input
          id="categoryName"
          label="Category Name"
          placeholder={type === "INCOME" ? "e.g. Consulting, Bonus, Dividend" : "e.g. Groceries, Gym, Dining"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
          Add Category
        </Button>
      </form>
    </Modal>
  );
};
