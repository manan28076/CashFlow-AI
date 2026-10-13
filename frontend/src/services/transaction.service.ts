import api from "./api";
import type { ApiResponse } from "../types/api";
import type {
  CreateTransactionPayload,
  DuplicateScanResult,
  PaginatedTransactions,
  ResolveDuplicatesPayload,
  Transaction,
  TransactionQueryParams,
  UpdateTransactionPayload,
} from "../types/transaction";

export const transactionService = {
  getAll: async (params?: TransactionQueryParams) => {
    const res = await api.get<ApiResponse<PaginatedTransactions>>(
      "/transactions",
      { params }
    );
    return res.data.data;
  },

  getDuplicates: async () => {
    const res = await api.get<ApiResponse<DuplicateScanResult>>(
      "/transactions/duplicates"
    );
    return res.data.data;
  },

  resolveDuplicates: async (payload: ResolveDuplicatesPayload) => {
    const res = await api.post<ApiResponse<{ deletedCount: number; message: string }>>(
      "/transactions/duplicates/resolve",
      payload
    );
    return res.data.data;
  },

  create: async (payload: CreateTransactionPayload) => {
    const res = await api.post<ApiResponse<Transaction>>(
      "/transactions",
      payload
    );
    return res.data.data;
  },

  update: async (id: string, payload: UpdateTransactionPayload) => {
    const res = await api.put<ApiResponse<Transaction>>(
      `/transactions/${id}`,
      payload
    );
    return res.data.data;
  },

  remove: async (id: string) => {
    await api.delete<ApiResponse<null>>(`/transactions/${id}`);
  },
};
