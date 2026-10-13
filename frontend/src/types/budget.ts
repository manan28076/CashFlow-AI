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
}

export interface MonthlyBudget {
  id: string;
  month: number;
  year: number;
  amount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isSet: boolean;
}

export interface CreateBudgetPayload {
  categoryId: string;
  amount: number;
  month: number;
  year: number;
}

export interface SetMonthlyBudgetPayload {
  amount: number;
  month: number;
  year: number;
  repeatMonths?: number;
}

export type UpdateBudgetPayload = Partial<CreateBudgetPayload>;
