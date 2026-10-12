import api from "./api";
import type { ApiResponse } from "../types/api";

export interface ParsedTransactionRow {
  tempId: string;
  date: string;
  description: string;
  merchant?: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  categoryId: string;
  categoryName: string;
  hash?: string;
  duplicate: boolean;
}

export interface StatementUploadResponse {
  accountId: string;
  accounts: Array<{ id: string; name: string; bankName: string }>;
  categories: Array<{ id: string; name: string }>;
  summary: {
    total: number;
    newCount: number;
    duplicateCount: number;
  };
  transactions: ParsedTransactionRow[];
}

export interface ConfirmImportResponse {
  importedCount: number;
  skippedDuplicates: number;
}

export const importService = {
  uploadStatement: async (file: File, accountId?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (accountId) {
      formData.append("accountId", accountId);
    }

    const res = await api.post<ApiResponse<StatementUploadResponse>>(
      "/import/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 120000, // 120 seconds timeout for large PDFs
      }
    );
    return res.data.data;
  },

  confirmImport: async (transactions: ParsedTransactionRow[], accountId: string) => {
    const res = await api.post<ApiResponse<ConfirmImportResponse>>(
      "/import/confirm",
      { transactions, accountId },
      { timeout: 60000 }
    );
    return res.data.data;
  },
};
