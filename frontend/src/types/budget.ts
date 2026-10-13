import type { Category } from "./category";

export interface Budget {
  id: string;
  amount: number;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  categoryId: string;
  category?: Category;
  spent?: number;
  remaining?: number;
  percentUsed?: number;
  isRecurring?: boolean;
  isUnset?: boolean;
  isOverall?: boolean;
}

export interface CreateBudgetPayload {
  categoryId: string;
  amount: number;
  month: number;
  year: number;
}

export type UpdateBudgetPayload = Partial<CreateBudgetPayload>;
