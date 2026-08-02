import api from "./api";
import type { ApiResponse } from "../types/api";
import type {
  CategoryBreakdownItem,
  DashboardSummary,
  MonthlyTrendItem,
} from "../types/dashboard";
import type { Transaction } from "../types/transaction";

export const dashboardService = {
  getSummary: async () => {
    const res = await api.get<ApiResponse<DashboardSummary>>(
      "/dashboard/summary"
    );
    return res.data.data;
  },

  getCategoryBreakdown: async () => {
    const res = await api.get<ApiResponse<CategoryBreakdownItem[]>>(
      "/dashboard/category-breakdown"
    );
    return res.data.data;
  },

  getRecentTransactions: async () => {
    const res = await api.get<ApiResponse<Transaction[]>>(
      "/dashboard/recent-transactions"
    );
    return res.data.data;
  },

  getMonthlyTrend: async () => {
    const res = await api.get<ApiResponse<MonthlyTrendItem[]>>(
      "/dashboard/monthly-trend"
    );
    return res.data.data;
  },
};
