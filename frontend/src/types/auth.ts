export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  plan?: "STARTER" | "PRO" | "FAMILY" | string;
  planBillingCycle?: "monthly" | "annual" | null | string;
  subscriptionStatus?: "ACTIVE" | "EXPIRED" | "CANCELLED" | "INACTIVE" | string;
  subscriptionStartedAt?: string | null;
  subscriptionExpiresAt?: string | null;
  createdAt: string;
}


export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
