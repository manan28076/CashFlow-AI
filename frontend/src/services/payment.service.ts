import api from "./api";
import type { ApiResponse } from "../types/api";
import type { User } from "../types/auth";

export interface SubscriptionPaymentRecord {
  id: string;
  userId: string;
  plan: "PRO" | "FAMILY" | string;
  billingCycle: "monthly" | "annual" | string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string | null;
  status: "PENDING" | "SUCCESS" | "FAILED" | string;
  startedAt: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  paise: number;
  currency: string;
  keyId: string;
  plan: string;
  billingCycle: string;
  paymentRecordId: string;
  isTestMode: boolean;
}

export interface VerifyPaymentResponse {
  user: User;
  payment: SubscriptionPaymentRecord;
}

export interface SubscriptionDetailsResponse {
  user: User;
  daysRemaining: number;
  payments: SubscriptionPaymentRecord[];
}

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn("Failed to load Razorpay checkout script.");
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const paymentService = {
  createOrder: async (plan: "pro" | "family", billingCycle: "monthly" | "annual") => {
    const res = await api.post<ApiResponse<CreateOrderResponse>>("/payment/create-order", {
      plan,
      billingCycle,
    });
    return res.data.data;
  },

  verifyPayment: async (payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature?: string;
  }) => {
    const res = await api.post<ApiResponse<VerifyPaymentResponse>>("/payment/verify-payment", payload);
    return res.data.data;
  },

  getSubscription: async () => {
    const res = await api.get<ApiResponse<SubscriptionDetailsResponse>>("/payment/subscription");
    return res.data.data;
  },

  cancelSubscription: async () => {
    const res = await api.post<ApiResponse<User>>("/payment/cancel");
    return res.data.data;
  },
};
