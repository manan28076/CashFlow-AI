import type { Account } from "./account";
import type { Category } from "./category";

export type TransactionType = "INCOME" | "EXPENSE";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  merchant: string | null;
  note: string | null;
  amount: number;
  type: TransactionType;
  isAnomaly: boolean;
  createdAt: string;
  accountId: string;
  categoryId: string;
  account?: Account;
  category?: Category;
}

export interface CreateTransactionPayload {
  accountId: string;
  categoryId: string;
  amount: number;
  type: TransactionType;
  merchant?: string;
  note?: string;
  description: string;
  date: string;
  allowDuplicate?: boolean;
}

export type UpdateTransactionPayload = Partial<CreateTransactionPayload>;

export interface DuplicateGroup {
  groupKey: string;
  date: string;
  amount: number;
  type: TransactionType;
  description: string;
  merchant?: string | null;
  categoryName: string;
  accountName: string;
  transactions: Transaction[];
}

export interface DuplicateScanResult {
  totalDuplicateGroups: number;
  totalRedundantTransactions: number;
  groups: DuplicateGroup[];
}

export interface ResolveDuplicatesPayload {
  action: "clean_all" | "delete_ids";
  idsToDelete?: string[];
}

export interface TransactionQueryParams {
  search?: string;
  categoryId?: string;
  accountId?: string;
  type?: TransactionType;
  sortBy?: "date" | "amount";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
