import api from "./api";
import type { ApiResponse } from "../types/api";
import type { AIUploadResult, AskResult, ChatResult } from "../types/ai";

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
};
