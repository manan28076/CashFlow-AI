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

export interface AvailableMonth {
  year: number;
  month: number;
}

export interface CategoryBreakdownResponse {
  items: CategoryBreakdownItem[];
  total: number;
  selectedMonth: number | null;
  selectedYear: number | null;
  availableMonths: AvailableMonth[];
}

export interface MonthlyTrendItem {
  month: string;
  income: number;
  expense: number;
}
