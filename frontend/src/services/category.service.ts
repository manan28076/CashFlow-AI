import api from "./api";
import type { ApiResponse } from "../types/api";
import type { Category, CreateCategoryPayload } from "../types/category";

export const categoryService = {
  getAll: async () => {
    const res = await api.get<ApiResponse<Category[]>>("/categories");
    return res.data.data;
  },

  create: async (payload: CreateCategoryPayload) => {
    const res = await api.post<ApiResponse<Category>>(
      "/categories",
      payload
    );
    return res.data.data;
  },

  remove: async (id: string) => {
    await api.delete<ApiResponse<null>>(`/categories/${id}`);
  },
};
