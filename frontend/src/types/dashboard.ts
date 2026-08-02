export interface DashboardSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  currentMonthSpending: number;
}

export interface CategoryBreakdownItem {
  category: string;
  amount: number;
}

export interface MonthlyTrendItem {
  month: string;
  income: number;
  expense: number;
}
