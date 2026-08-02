import api from "./api";
import type { ApiResponse } from "../types/api";
import type {
  Account,
  CreateAccountPayload,
  UpdateAccountPayload,
} from "../types/account";

export const accountService = {
  getAll: async () => {
    const res = await api.get<ApiResponse<Account[]>>("/accounts");
    return res.data.data;
  },

  create: async (payload: CreateAccountPayload) => {
    const res = await api.post<ApiResponse<Account>>("/accounts", payload);
    return res.data.data;
  },

  update: async (id: string, payload: UpdateAccountPayload) => {
    const res = await api.put<ApiResponse<Account>>(
      `/accounts/${id}`,
      payload
    );
    return res.data.data;
  },

  remove: async (id: string) => {
    await api.delete<ApiResponse<null>>(`/accounts/${id}`);
  },
};
