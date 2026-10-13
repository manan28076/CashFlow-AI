import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { monthName } from "../../utils/formatters";

interface MonthlyBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    amount: number;
    month: number;
    year: number;
    repeatMonths?: number;
  }) => Promise<void>;
  initialMonth: number;
  initialYear: number;
  currentAmount?: number;
}

export const MonthlyBudgetModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialMonth,
  initialYear,
  currentAmount = 0,
}: MonthlyBudgetModalProps) => {
  const [amount, setAmount] = useState<number>(currentAmount);
  const [month, setMonth] = useState<number>(initialMonth);
  const [year, setYear] = useState<number>(initialYear);
  const [repeatMonths, setRepeatMonths] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount(currentAmount);
      setMonth(initialMonth);
      setYear(initialYear);
      setRepeatMonths(1);
    }
  }, [isOpen, initialMonth, initialYear, currentAmount]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ amount, month, year, repeatMonths });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentAmount > 0 ? "Edit Total Monthly Budget" : "Set Total Monthly Budget"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="rounded-xl bg-indigo-50/80 border border-indigo-100/90 p-3.5 text-xs text-indigo-900 leading-relaxed">
          <p className="font-semibold text-indigo-950 flex items-center gap-1.5">
            🎯 Month Overall Spending Target
          </p>
          <p className="mt-1 text-indigo-800">
            Set a single target limit for your entire spending in {monthName(month)} {year}. All your expenses across all categories are counted towards this total.
          </p>
        </div>

        <Input
          id="monthly-budget-amount"
          label={`Total Budget Limit for ${monthName(month)} ${year} (₹)`}
          type="number"
          step="1"
          placeholder="e.g. 50000"
          value={amount || ""}
          onChange={(e) => setAmount(Number(e.target.value))}
          required
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            id="monthly-budget-month"
            label="Month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i + 1}>
                {monthName(i + 1)}
              </option>
            ))}
          </Select>
          <Input
            id="monthly-budget-year"
            label="Year"
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>

        <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
          <label className="text-xs font-semibold text-stone-700 block mb-1">
            Apply to Subsequent Months
          </label>
          <Select
            id="monthly-budget-repeat"
            value={repeatMonths}
            onChange={(e) => setRepeatMonths(Number(e.target.value))}
          >
            <option value={1}>This month only ({monthName(month)} {year})</option>
            <option value={3}>Next 3 months</option>
            <option value={6}>Next 6 months</option>
            <option value={12}>Next 12 months (Full year)</option>
          </Select>
          <p className="text-[11px] text-stone-500 mt-1">
            Copies this total monthly limit forward to future months.
          </p>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : currentAmount > 0
              ? "Update Monthly Budget"
              : "Save Monthly Budget"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
