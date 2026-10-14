import { createContext, useEffect, useState, type ReactNode } from "react";
import { authService } from "../services/auth.service";
import type { LoginPayload, RegisterPayload, User } from "../types/auth";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>;
  loginWithDemo: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  updateUser: (updatedData: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

const TOKEN_KEY = "cashflow_token";
const USER_KEY = "cashflow_user";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async (): Promise<User | null> => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return null;
      const latestUser = await authService.me();
      if (latestUser) {
        setUser(latestUser);
        localStorage.setItem(USER_KEY, JSON.stringify(latestUser));
        return latestUser;
      }
      return null;
    } catch (err) {
      console.warn("Failed to refresh user profile from server:", err);
      return null;
    }
  };

  const updateUser = (updatedData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updatedData };
      localStorage.setItem(USER_KEY, JSON.stringify(merged));
      return merged;
    });
  };

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse cached user:", e);
      }
      // Re-validate against server to verify active subscription expiration status
      refreshUser();
    }
    setIsLoading(false);
  }, []);

  const login = async (payload: LoginPayload) => {
    const data = await authService.login(payload);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async (payload: RegisterPayload) => {
    const data = await authService.register(payload);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  };

  const loginWithGoogle = async (token: string) => {
    const data = await authService.googleLogin(token);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  };

  const loginWithDemo = async () => {
    const data = await authService.demoLogin();
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        loginWithGoogle,
        loginWithDemo,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
