import api from "./api";
import type { ApiResponse } from "../types/api";
import type { AIUploadResult, AskResult, ChatResult, AgentResult } from "../types/ai";

export const aiService = {
  uploadStatement: async (file: File, accountId: string) => {
    const formData = new FormData();
    formData.append("statement", file);
    formData.append("accountId", accountId);

    const res = await api.post<ApiResponse<AIUploadResult>>(
      "/ai/upload",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data.data;
  },

  ask: async (question: string) => {
    const res = await api.post<ApiResponse<AskResult>>("/ai/ask", {
      question,
    });
    return res.data.data;
  },

  chat: async (message: string) => {
    const res = await api.post<ApiResponse<ChatResult>>("/ai/chat", {
      message,
    });
    return res.data.data;
  },

  agent: async (
    message: string,
    conversationHistory?: Array<{ role: "user" | "assistant" | "model"; text: string }>
  ) => {
    const res = await api.post<ApiResponse<AgentResult>>(
      "/ai/agent",
      {
        message,
        conversationHistory,
      },
      { timeout: 60000 }
    );
    return res.data.data;
  },

  confirmAction: async (actionId: string, cancel = false) => {
    const res = await api.post<
      ApiResponse<{ success: boolean; status: string; message: string; result?: unknown }>
    >("/ai/agent/confirm", {
      actionId,
      cancel,
    });
    return res.data.data;
  },

  runLiveAudit: async () => {
    try {
      const res = await api.post<ApiResponse<any>>("/ai/live-audit");
      if (res.data.data) {
        return res.data.data;
      }
    } catch {
      // Fallback: fetch user's real transactions and use /ai/test
    }

    const txRes = await api.get<ApiResponse<{ transactions: any[] }>>("/transactions", {
      params: { limit: 50 },
    });
    const txList = txRes.data.data?.transactions || [];
    if (txList.length === 0) {
      return null;
    }

    const testRes = await api.post<ApiResponse<any>>("/ai/test", {
      transactions: txList.map((t) => ({
        merchant: t.merchant || t.description || "Expense",
        amount: Number(t.amount) || 0,
        date: t.date ? String(t.date).split("T")[0] : undefined,
      })),
    });

    return {
      transactionCount: txList.length,
      insights: testRes.data.data.insights || null,
      budget: testRes.data.data.budget || null,
      fraud: testRes.data.data.fraud || null,
      health: testRes.data.data.health || null,
    };
  },
};
