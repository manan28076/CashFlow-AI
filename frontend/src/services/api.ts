import axios, { type AxiosError } from "axios";

const getBaseUrl = () => {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_DEV_API_URL || "http://localhost:5000/api";
  }
  return import.meta.env.VITE_API_BASE_URL || "https://cashflow-ai-oz1i.onrender.com/api";
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cashflow_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("cashflow_token");
      localStorage.removeItem("cashflow_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    const data = error.response?.data as any;
    const message =
      data?.message || error.message || "Something went wrong";
    const enhancedError = new Error(message) as any;
    enhancedError.status = error.response?.status;
    enhancedError.statusCode = error.response?.status;
    enhancedError.isDuplicate = Boolean(data?.isDuplicate || error.response?.status === 409);
    enhancedError.duplicateDetails = data?.duplicateDetails;
    enhancedError.response = error.response;
    return Promise.reject(enhancedError);
  }
);

export default api;
