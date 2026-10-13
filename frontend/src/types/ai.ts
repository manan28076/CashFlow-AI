import type { Transaction } from "./transaction";

export interface AIUploadResult {
  transactions: Transaction[];
  insights: InsightResult | null;
  budget: BudgetAdviceResult | null;
  fraud: FraudResult | null;
  health: HealthResult | null;
}

export interface LiveAuditResult {
  transactionCount?: number;
  insights: InsightResult | null;
  budget: BudgetAdviceResult | null;
  fraud: FraudResult | null;
  health: HealthResult | null;
}

export interface InsightResult {
  summary: string;
  topCategory: string;
  recommendation: string;
}

export interface BudgetAdviceResult {
  status: string;
  reason: string;
  suggestion: string;
}

export interface FraudResult {
  risk: "LOW" | "MEDIUM" | "HIGH";
  flaggedIds: number[];
  reason: string;
}

export interface HealthResult {
  score: number;
  grade: string;
  reason: string;
  advice: string;
}

export interface AskResult {
  question: string;
  sql: string;
  rows: Record<string, unknown>[];
}

export interface ChatResult {
  intent: "DATA_QUERY" | "GENERAL_ADVICE";
  sql?: string;
  rows?: Record<string, unknown>[];
  answer: string;
}
