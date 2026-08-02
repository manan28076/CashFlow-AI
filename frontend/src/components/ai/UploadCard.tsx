import { useRef, useState } from "react";
import { UploadCloud, FileText, Sparkles } from "lucide-react";
import { Card } from "../ui/Card";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import type { Account } from "../../types/account";

interface UploadCardProps {
  accounts: Account[];
  onAnalyze: (file: File, accountId: string) => Promise<void>;
  isAnalyzing: boolean;
}

export const UploadCard = ({ accounts, onAnalyze, isAnalyzing }: UploadCardProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState("");

  const handleSubmit = async () => {
    if (!file || !accountId) return;
    await onAnalyze(file, accountId);
  };

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-white to-orange-50">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles size={20} className="text-orange-600" />
        <h2 className="text-lg font-semibold text-stone-900">AI Statement Analysis</h2>
      </div>
      <p className="mb-5 text-sm text-stone-500">
        Upload a bank statement CSV and let the AI agents categorize transactions,
        flag anomalies, and generate insights automatically.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <Select
          id="uploadAccount"
          label="Account"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="sm:w-56"
        >
          <option value="">Select account</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-1 items-center gap-3 rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 py-2.5 text-left text-sm text-stone-500 hover:border-orange-500"
        >
          {file ? <FileText size={18} className="text-orange-600" /> : <UploadCloud size={18} />}
          <span className="truncate">{file ? file.name : "Choose CSV file"}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <Button
          onClick={handleSubmit}
          disabled={!file || !accountId}
          isLoading={isAnalyzing}
        >
          Run AI Analysis
        </Button>
      </div>
    </Card>
  );
};
