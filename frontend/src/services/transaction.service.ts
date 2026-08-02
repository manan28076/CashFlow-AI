import api from "./api";
import type { ApiResponse } from "../types/api";
import type {
  CreateTransactionPayload,
  PaginatedTransactions,
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
