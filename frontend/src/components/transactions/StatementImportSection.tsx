import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  ShieldCheck,
  HelpCircle,
  RefreshCw,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import {
  importService,
  type ParsedTransactionRow,
  type StatementUploadResponse,
} from "../../services/import.service";

interface StatementImportSectionProps {
  onImportSuccess?: () => void;
}

export const StatementImportSection = ({ onImportSuccess }: StatementImportSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [uploadData, setUploadData] = useState<StatementUploadResponse | null>(null);
  const [transactions, setTransactions] = useState<ParsedTransactionRow[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [showGuide, setShowGuide] = useState(false);

  // Edit Modal State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    date: string;
    description: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    categoryId: string;
  }>({
    date: "",
    description: "",
    amount: 0,
    type: "EXPENSE",
    categoryId: "",
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDropRejected: (rejections) => {
      const err = rejections[0]?.errors[0];
      if (err?.code === "file-too-large") {
        toast.error("File is too large. Maximum size is 10 MB.");
      } else {
        toast.error("Invalid file format. Please upload a PDF, CSV, or Excel file.");
      }
    },
  });

  const handleUploadAndParse = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await importService.uploadStatement(file, selectedAccountId);
      setUploadData(data);
      setTransactions(data.transactions);
      setSelectedAccountId(data.accountId);
      toast.success(
        `Parsed ${data.summary.total} transactions (${data.summary.newCount} new, ${data.summary.duplicateCount} duplicates)`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse statement");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCategoryChange = (index: number, newCategoryId: string) => {
    const next = [...transactions];
    const cat = uploadData?.categories.find((c) => c.id === newCategoryId);
    next[index] = {
      ...next[index],
      categoryId: newCategoryId,
      categoryName: cat ? cat.name : next[index].categoryName,
    };
    setTransactions(next);
  };

  const handleDeleteRow = (index: number) => {
    const next = transactions.filter((_, i) => i !== index);
    setTransactions(next);
    toast.success("Transaction removed from preview");
  };

  const handleOpenEdit = (index: number) => {
    const tx = transactions[index];
    setEditingIndex(index);
    setEditForm({
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      categoryId: tx.categoryId,
    });
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const next = [...transactions];
    const cat = uploadData?.categories.find((c) => c.id === editForm.categoryId);
    next[editingIndex] = {
      ...next[editingIndex],
      date: editForm.date,
      description: editForm.description,
      merchant: editForm.description,
      amount: Number(editForm.amount),
      type: editForm.type,
      categoryId: editForm.categoryId,
      categoryName: cat ? cat.name : next[editingIndex].categoryName,
    };
    setTransactions(next);
    setEditingIndex(null);
    toast.success("Transaction updated!");
  };

  const handleConfirmImport = async () => {
    if (!uploadData || !selectedAccountId) return;

    const rowsToImport = transactions.filter((r) => !r.duplicate);
    if (rowsToImport.length === 0) {
      toast.error("No new transactions to import.");
      return;
    }

    setIsConfirming(true);
    try {
      const res = await importService.confirmImport(rowsToImport, selectedAccountId);
      toast.success(`Successfully imported ${res.importedCount} transactions!`);
      handleReset();
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to import transactions");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setUploadData(null);
    setTransactions([]);
  };

  const newTransactionsCount = transactions.filter((t) => !t.duplicate).length;
  const duplicateTransactionsCount = transactions.filter((t) => t.duplicate).length;

  return (
    <Card className="flex flex-col gap-4 border border-stone-200/90 dark:border-blue-900/40 bg-white dark:bg-[#111c35] p-5 sm:p-6 shadow-xs">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 shadow-2xs">
            <UploadCloud size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-stone-900 dark:text-white">Import Statement</h2>
              <span className="rounded-full bg-orange-50 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/60 px-2 py-0.5 text-xs font-semibold">
                PDF / Excel / CSV
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-slate-400">
              Upload bank or UPI statements &mdash; AI automatically parses, categorizes, and checks duplicates
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-white self-start sm:self-auto cursor-pointer"
        >
          <span>{isExpanded ? "Collapse" : "Expand Uploader"}</span>
          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {isExpanded && (
        <>
          {!uploadData ? (
            <div className="flex flex-col gap-4 pt-1">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors md:p-8 ${
                  isDragActive
                    ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/40"
                    : "border-stone-300 dark:border-blue-900/60 hover:border-orange-400 dark:hover:border-blue-500 hover:bg-stone-50/50 dark:hover:bg-[#0c1426]"
                }`}
              >
                <input {...getInputProps()} />
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400">
                  <UploadCloud size={24} />
                </div>
                <p className="text-sm font-semibold text-stone-800 dark:text-white">
                  {file ? file.name : "Drag and drop your statement file here, or browse"}
                </p>
                <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">
                  Supports PDF, CSV, XLSX, and XLS (Max 10 MB, up to 40 pages)
                </p>
                {file && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-stone-100 dark:bg-slate-800 px-3 py-1.5 text-xs text-stone-700 dark:text-slate-200">
                    <FileText size={14} className="text-orange-600 dark:text-orange-400" />
                    <span>{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                )}
              </div>

              {/* Action buttons & privacy note */}
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-slate-400">
                  <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    <strong>Privacy First:</strong> Statements are processed in-memory by AI. Files are never stored on disk.
                  </span>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="flex items-center gap-1 text-xs text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-white cursor-pointer mr-1"
                  >
                    <HelpCircle size={14} />
                    <span>Bank guide</span>
                  </button>
                  {file && (
                    <Button variant="ghost" onClick={() => setFile(null)} disabled={isUploading} className="text-xs">
                      Clear
                    </Button>
                  )}
                  <Button
                    onClick={handleUploadAndParse}
                    disabled={!file}
                    isLoading={isUploading}
                    className="gap-2 font-medium"
                  >
                    {isUploading ? "Extracting with AI..." : "Parse Statement"}
                  </Button>
                </div>
              </div>

              {isUploading && (
                <div className="rounded-xl bg-orange-50 border border-orange-200/80 p-3.5 text-xs text-orange-900">
                  <div className="flex items-center gap-2 font-semibold">
                    <RefreshCw size={14} className="animate-spin text-orange-600" />
                    <span>AI extraction in progress...</span>
                  </div>
                  <p className="mt-1 text-[11px] text-orange-800">
                    Multipage bank PDFs can take 15–35 seconds as Gemini reads pages and matches tables. Please keep this tab open.
                  </p>
                </div>
              )}

              {/* Collapsible bank download guide */}
              {showGuide && (
                <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3.5 text-xs">
                  <p className="font-bold text-stone-800 mb-2">How to download statements:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-stone-600 text-[11px]">
                    <div className="rounded-lg bg-white p-2 border border-stone-200">
                      <strong>PhonePe:</strong> History tab &rarr; Download Statement &rarr; Select duration.
                    </div>
                    <div className="rounded-lg bg-white p-2 border border-stone-200">
                      <strong>Paytm:</strong> Balance & History &rarr; Bank Account &rarr; Download Statement.
                    </div>
                    <div className="rounded-lg bg-white p-2 border border-stone-200">
                      <strong>Google Pay:</strong> Profile &rarr; Bank Accounts &rarr; Download Statement.
                    </div>
                    <div className="rounded-lg bg-white p-2 border border-stone-200">
                      <strong>HDFC / SBI / ICICI:</strong> NetBanking / App &rarr; Statements &rarr; Download PDF/Excel.
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Preview Table Section */
            <div className="flex flex-col gap-4 pt-1">
              <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 md:flex-row md:items-center">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center rounded-md bg-stone-900 px-2.5 py-1 text-xs font-semibold text-white">
                    {transactions.length} Total
                  </span>
                  <span className="text-xs text-stone-600">
                    <strong className="text-emerald-700">{newTransactionsCount} new</strong> ·{" "}
                    <span className="text-stone-400">{duplicateTransactionsCount} duplicates skipped</span>
                  </span>
                </div>

                <div className="flex w-full flex-wrap items-center gap-2.5 md:w-auto">
                  <div className="w-52">
                    <select
                      id="target-account"
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 outline-none focus:border-orange-500"
                    >
                      {uploadData.accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.bankName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button variant="ghost" onClick={handleReset} disabled={isConfirming} className="text-xs">
                    Cancel
                  </Button>

                  <Button
                    onClick={handleConfirmImport}
                    disabled={newTransactionsCount === 0}
                    isLoading={isConfirming}
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-medium"
                  >
                    <CheckCircle2 size={15} />
                    Import {newTransactionsCount} Transactions
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full text-left text-xs text-stone-600">
                  <thead className="border-b border-stone-200 bg-stone-100/70 text-[11px] font-bold uppercase text-stone-500">
                    <tr>
                      <th className="px-3.5 py-2.5">Date</th>
                      <th className="px-3.5 py-2.5">Description</th>
                      <th className="px-3.5 py-2.5">Category</th>
                      <th className="px-3.5 py-2.5 text-right">Amount</th>
                      <th className="px-3.5 py-2.5 text-center">Status</th>
                      <th className="px-3.5 py-2.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 bg-white">
                    {transactions.map((tx, idx) => {
                      const isDup = tx.duplicate;
                      const isIncome = tx.type === "INCOME";

                      return (
                        <tr
                          key={tx.tempId || idx}
                          className={`transition-colors ${
                            isDup ? "bg-stone-50/80 text-stone-400" : "hover:bg-stone-50"
                          }`}
                        >
                          <td className="whitespace-nowrap px-3.5 py-2 font-mono text-[11px]">
                            {tx.date}
                          </td>
                          <td className="max-w-xs px-3.5 py-2">
                            <div className="font-semibold text-stone-800 truncate">
                              {tx.merchant || tx.description}
                            </div>
                            {tx.merchant && tx.description !== tx.merchant && (
                              <div className="truncate text-[10px] text-stone-400" title={tx.description}>
                                {tx.description}
                              </div>
                            )}
                          </td>
                          <td className="px-3.5 py-2">
                            {isDup ? (
                              <span className="text-[11px] text-stone-400">{tx.categoryName}</span>
                            ) : (
                              <select
                                value={tx.categoryId}
                                onChange={(e) => handleCategoryChange(idx, e.target.value)}
                                className="rounded-md border border-stone-300 bg-white px-2 py-0.5 text-xs text-stone-700 shadow-2xs focus:border-orange-500"
                              >
                                {uploadData.categories.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td
                            className={`whitespace-nowrap px-3.5 py-2 text-right font-mono font-bold ${
                              isDup
                                ? "text-stone-400"
                                : isIncome
                                ? "text-emerald-600"
                                : "text-stone-900"
                            }`}
                          >
                            {isIncome ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="whitespace-nowrap px-3.5 py-2 text-center">
                            {isDup ? (
                              <span className="rounded bg-stone-200 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                                Duplicate
                              </span>
                            ) : (
                              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                New
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3.5 py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(idx)}
                                className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
                                title="Edit"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(idx)}
                                className="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                                title="Remove"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Transaction Modal */}
      <Modal
        isOpen={editingIndex !== null}
        onClose={() => setEditingIndex(null)}
        title="Edit Transaction Details"
      >
        <div className="flex flex-col gap-4">
          <Input
            id="edit-date"
            label="Date (YYYY-MM-DD)"
            type="date"
            value={editForm.date}
            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
          />
          <Input
            id="edit-description"
            label="Description / Merchant"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          />
          <Input
            id="edit-amount"
            label="Amount (₹)"
            type="number"
            step="0.01"
            value={editForm.amount}
            onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-stone-600">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEditForm({ ...editForm, type: "EXPENSE" })}
                className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                  editForm.type === "EXPENSE"
                    ? "bg-red-600 text-white"
                    : "border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                }`}
              >
                Expense (-)
              </button>
              <button
                type="button"
                onClick={() => setEditForm({ ...editForm, type: "INCOME" })}
                className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                  editForm.type === "INCOME"
                    ? "bg-emerald-600 text-white"
                    : "border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                }`}
              >
                Income (+)
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-stone-600">Category</label>
            <select
              value={editForm.categoryId}
              onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
              className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none focus:border-orange-500"
            >
              {uploadData?.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditingIndex(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};
