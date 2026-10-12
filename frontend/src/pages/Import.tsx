import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  ShieldCheck,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import {
  importService,
  type ParsedTransactionRow,
  type StatementUploadResponse,
} from "../services/import.service";

export const Import = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [uploadData, setUploadData] = useState<StatementUploadResponse | null>(null);
  const [transactions, setTransactions] = useState<ParsedTransactionRow[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

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

  const handleConfirmImport = async () => {
    if (!uploadData || !selectedAccountId) return;

    // Filter to only non-duplicates
    const rowsToImport = transactions.filter((r) => !r.duplicate);
    if (rowsToImport.length === 0) {
      toast.error("No new transactions to import. All rows are duplicates.");
      return;
    }

    setIsConfirming(true);
    try {
      const res = await importService.confirmImport(rowsToImport, selectedAccountId);
      toast.success(`Successfully imported ${res.importedCount} transactions!`);
      navigate("/dashboard");
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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Import Statement</h1>
        <p className="text-sm text-stone-500">
          Upload any bank or UPI statement (PDF, Excel, or CSV) to extract and auto-categorize transactions.
        </p>
      </div>

      {!uploadData ? (
        <div className="flex flex-col gap-6">
          {/* Dropzone Card */}
          <Card>
            <div
              {...getRootProps()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors md:p-12 ${
                isDragActive
                  ? "border-orange-500 bg-orange-50/50"
                  : "border-stone-300 hover:border-orange-400 hover:bg-stone-50/50"
              }`}
            >
              <input {...getInputProps()} />
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <UploadCloud size={28} />
              </div>
              <p className="font-medium text-stone-800">
                {file ? file.name : "Drag and drop your statement file here"}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Supports PDF, CSV, XLSX, and XLS (Max 10 MB, up to 40 pages)
              </p>
              {file && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-stone-100 px-3 py-1.5 text-xs text-stone-700">
                  <FileText size={14} className="text-orange-600" />
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-stone-100 pt-4 sm:flex-row">
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>
                  <strong>Privacy First:</strong> Statements are processed in-memory by AI to extract transactions. Files are never stored on disk.
                </span>
              </div>
              <div className="flex w-full items-center gap-3 sm:w-auto">
                {file && (
                  <Button variant="ghost" onClick={() => setFile(null)} disabled={isUploading}>
                    Clear
                  </Button>
                )}
                <Button
                  onClick={handleUploadAndParse}
                  disabled={!file}
                  isLoading={isUploading}
                  className="w-full sm:w-auto"
                >
                  {isUploading ? "Extracting with AI..." : "Parse Statement"}
                </Button>
              </div>
            </div>

            {isUploading && (
              <div className="mt-4 rounded-lg bg-orange-50 p-4 text-xs text-orange-800">
                <div className="flex items-center gap-2 font-medium">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>AI extraction in progress...</span>
                </div>
                <p className="mt-1 text-orange-700">
                  Multipage bank PDFs can take 15–35 seconds as Gemini reads pages and matches transaction tables. Please keep this tab open.
                </p>
              </div>
            )}
          </Card>

          {/* Help & Guide Section */}
          <Card>
            <div className="flex items-center gap-2 font-medium text-stone-900">
              <HelpCircle size={18} className="text-orange-600" />
              <span>Where to download statements from Indian apps?</span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 text-xs text-stone-600 sm:grid-cols-2 md:grid-cols-4">
              <div className="rounded-lg border border-stone-200 p-3">
                <h4 className="font-semibold text-stone-900">PhonePe</h4>
                <p className="mt-1 text-stone-500">
                  History tab &rarr; Top right "Download Statement" &rarr; Select duration &rarr; Download PDF/CSV.
                </p>
              </div>
              <div className="rounded-lg border border-stone-200 p-3">
                <h4 className="font-semibold text-stone-900">Paytm</h4>
                <p className="mt-1 text-stone-500">
                  Balance & History &rarr; Bank Account / Wallet &rarr; "Download Statement" &rarr; Choose format.
                </p>
              </div>
              <div className="rounded-lg border border-stone-200 p-3">
                <h4 className="font-semibold text-stone-900">Google Pay</h4>
                <p className="mt-1 text-stone-500">
                  Profile &rarr; Bank Accounts &rarr; Download statement or get email statement from your bank.
                </p>
              </div>
              <div className="rounded-lg border border-stone-200 p-3">
                <h4 className="font-semibold text-stone-900">HDFC / SBI / ICICI</h4>
                <p className="mt-1 text-stone-500">
                  NetBanking / Mobile App &rarr; Accounts &rarr; Statements &rarr; Download e-Statement (PDF or Excel).
                </p>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        /* Preview Table Section */
        <div className="flex flex-col gap-6">
          {/* Summary and Target Account Selector */}
          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-md bg-stone-900 px-2.5 py-1 text-xs font-semibold text-white">
                {uploadData.summary.total} Extracted
              </span>
              <span className="text-sm text-stone-600">
                <strong className="text-emerald-700">{newTransactionsCount} new</strong> ·{" "}
                <span className="text-stone-400">{duplicateTransactionsCount} duplicates skipped</span>
              </span>
            </div>

            <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
              <div className="w-56">
                <select
                  id="target-account"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                >
                  {uploadData.accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.bankName})
                    </option>
                  ))}
                </select>
              </div>

              <Button variant="ghost" onClick={handleReset} disabled={isConfirming}>
                Cancel
              </Button>

              <Button
                onClick={handleConfirmImport}
                disabled={newTransactionsCount === 0}
                isLoading={isConfirming}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 size={16} />
                Import {newTransactionsCount} Transactions
              </Button>
            </div>
          </div>

          {/* Table */}
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-600">
                <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold uppercase text-stone-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Description / Merchant</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
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
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                          {tx.date}
                        </td>
                        <td className="max-w-md px-4 py-3">
                          <div className="font-medium text-stone-800">
                            {tx.merchant || tx.description}
                          </div>
                          {tx.merchant && tx.description !== tx.merchant && (
                            <div className="truncate text-xs text-stone-400" title={tx.description}>
                              {tx.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isDup ? (
                            <span className="text-xs text-stone-400">{tx.categoryName}</span>
                          ) : (
                            <div className="w-36">
                              <select
                                value={tx.categoryId}
                                onChange={(e) => handleCategoryChange(idx, e.target.value)}
                                className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-stone-700 shadow-sm focus:border-orange-500 focus:outline-none"
                              >
                                {uploadData.categories.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </td>
                        <td
                          className={`whitespace-nowrap px-4 py-3 text-right font-mono font-medium ${
                            isDup
                              ? "text-stone-400"
                              : isIncome
                              ? "text-emerald-600"
                              : "text-stone-900"
                          }`}
                        >
                          {isIncome ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          {isDup ? (
                            <span className="inline-flex items-center gap-1 rounded bg-stone-200 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                              Duplicate
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                              New
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

