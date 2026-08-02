import api from "./api";
import type { ApiResponse } from "../types/api";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from "../types/auth";

export const authService = {
  register: async (payload: RegisterPayload) => {
    const res = await api.post<ApiResponse<AuthResponse>>(
      "/auth/register",
      payload
    );
    return res.data.data;
  },

  login: async (payload: LoginPayload) => {
    const res = await api.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      payload
    );
    return res.data.data;
  },

  me: async () => {
    const res = await api.get<ApiResponse<User>>("/auth/me");
    return res.data.data;
  },
};
