import { useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, Copy, Trash2, CheckCircle2, ChevronRight, RefreshCw, X } from "lucide-react";
import { transactionService } from "../../services/transaction.service";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import type { DuplicateScanResult, DuplicateGroup } from "../../types/transaction";

interface DuplicateManagerBannerProps {
  duplicates: DuplicateScanResult | null;
  onResolved: () => void;
  isLoading?: boolean;
}

export const DuplicateManagerBanner = ({
  duplicates,
  onResolved,
  isLoading = false,
}: DuplicateManagerBannerProps) => {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);

  if (!duplicates || duplicates.totalRedundantTransactions === 0) {
    return null;
  }

  const handleCleanAll = async () => {
    if (
      !confirm(
        `Are you sure you want to clean all ${duplicates.totalRedundantTransactions} redundant duplicate records? The original earliest copy of each transaction will be kept intact.`
      )
    ) {
      return;
    }

    setIsCleaning(true);
    try {
      const res = await transactionService.resolveDuplicates({ action: "clean_all" });
      toast.success(res.message || `Cleaned ${res.deletedCount} duplicate records.`);
      setIsReviewOpen(false);
      onResolved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to clean duplicates");
    } finally {
      setIsCleaning(false);
    }
  };

  const handleDeleteSingle = async (transactionId: string) => {
    setIsCleaning(true);
    try {
      await transactionService.remove(transactionId);
      toast.success("Duplicate copy removed.");
      onResolved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove transaction");
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50/70 to-yellow-50/60 p-4 sm:p-5 shadow-xs animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 shadow-2xs">
              <AlertTriangle className="h-5 w-5 animate-pulse text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/80 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-900">
                  <Copy size={11} /> {duplicates.totalRedundantTransactions} Redundant Found
                </span>
                <span className="text-xs text-amber-800/80">
                  Across {duplicates.totalDuplicateGroups} groups
                </span>
              </div>
              <h3 className="mt-1 text-sm sm:text-base font-bold text-amber-950">
                Duplicate Transactions Detected
              </h3>
              <p className="mt-0.5 text-xs sm:text-sm text-amber-900/80">
                Identical transactions with matching amount, date, description, and account were
                found. Keep your budget and analytics accurate by removing redundant copies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsReviewOpen(true)}
              disabled={isLoading || isCleaning}
              className="text-xs font-semibold bg-white border border-amber-300/80 text-amber-900 hover:bg-amber-100/60"
            >
              Review Details
            </Button>
            <Button
              type="button"
              onClick={handleCleanAll}
              isLoading={isCleaning}
              disabled={isLoading || isCleaning}
              className="text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs gap-1.5"
            >
              <Trash2 size={13} />
              Clean All Duplicates
            </Button>
          </div>
        </div>
      </div>

      {/* REVIEW & CLEAN MODAL */}
      <Modal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title="Review Duplicate Transactions"
        className="max-w-2xl"
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200 flex items-center justify-between">
            <p>
              Found <strong>{duplicates.totalDuplicateGroups} groups</strong> with{" "}
              <strong>{duplicates.totalRedundantTransactions} extra duplicate copies</strong>.
              "Clean All" keeps the earliest entry and removes the duplicates.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={handleCleanAll}
              isLoading={isCleaning}
              className="shrink-0 text-xs bg-amber-600 hover:bg-amber-700 text-white ml-3"
            >
              Clean All
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
            {duplicates.groups.map((group, gIdx) => (
              <div key={group.groupKey || gIdx} className="p-3.5 hover:bg-stone-50/70 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900 text-sm truncate">
                        {group.description || group.merchant || "Transaction"}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          group.type === "INCOME"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-stone-100 text-stone-700"
                        }`}
                      >
                        {group.type}
                      </span>
                      <span className="text-xs rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 font-bold">
                        {group.transactions.length}x duplicates
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                      <span>Date: {group.date}</span>
                      <span>•</span>
                      <span>Account: {group.accountName}</span>
                      <span>•</span>
                      <span>Category: {group.categoryName}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-base font-bold ${
                        group.type === "INCOME" ? "text-emerald-600" : "text-stone-900"
                      }`}
                    >
                      ₹{Number(group.amount).toLocaleString("en-IN")}
                    </div>
                    <span className="text-[11px] text-stone-500">per copy</span>
                  </div>
                </div>

                {/* Copies list */}
                <div className="mt-2.5 space-y-1.5 pl-3 border-l-2 border-amber-200">
                  {group.transactions.map((tx, idx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-md bg-stone-50 hover:bg-stone-100"
                    >
                      <div className="flex items-center gap-2 text-stone-600">
                        {idx === 0 ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded text-[10px]">
                            <CheckCircle2 size={10} /> Original (Kept)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded text-[10px]">
                            <Copy size={10} /> Duplicate copy #{idx}
                          </span>
                        )}
                        <span className="text-stone-500 text-[11px]">
                          Created: {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSingle(tx.id)}
                          disabled={isCleaning}
                          className="text-stone-400 hover:text-red-600 p-1 transition-colors"
                          title="Delete this duplicate copy"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsReviewOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
