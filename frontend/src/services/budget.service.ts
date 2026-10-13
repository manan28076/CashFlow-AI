import api from "./api";
import type { ApiResponse } from "../types/api";
import type {
  Budget,
  MonthlyBudget,
  CreateBudgetPayload,
  UpdateBudgetPayload,
  SetMonthlyBudgetPayload,
} from "../types/budget";

export const budgetService = {
  getAll: async (month?: number, year?: number) => {
    const res = await api.get<ApiResponse<Budget[]>>("/budgets", {
      params: { month, year },
    });
    return res.data.data;
  },

  create: async (payload: CreateBudgetPayload) => {
    const res = await api.post<ApiResponse<Budget>>("/budgets", payload);
    return res.data.data;
  },

  update: async (id: string, payload: UpdateBudgetPayload) => {
    const res = await api.put<ApiResponse<Budget>>(
      `/budgets/${id}`,
      payload
    );
    return res.data.data;
  },

  remove: async (id: string) => {
    await api.delete<ApiResponse<null>>(`/budgets/${id}`);
  },

  // Dedicated Monthly Budget API
  getMonthlyBudgets: async (month?: number, year?: number) => {
    const res = await api.get<ApiResponse<MonthlyBudget[]>>("/budgets/monthly", {
      params: { month, year },
    });
    return res.data.data;
  },

  setMonthlyBudget: async (payload: SetMonthlyBudgetPayload) => {
    const res = await api.post<ApiResponse<MonthlyBudget>>("/budgets/monthly", payload);
    return res.data.data;
  },

  removeMonthlyBudget: async (month: number, year: number) => {
    await api.delete<ApiResponse<null>>("/budgets/monthly", {
      params: { month, year },
    });
  },
};
