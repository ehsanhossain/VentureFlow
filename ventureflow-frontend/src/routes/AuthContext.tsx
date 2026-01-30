import { createContext, useState, useEffect, ReactNode } from "react";
import api from "../config/api";
import { showAlert } from "../components/Alert";

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  is_partner?: boolean;
  must_change_password?: boolean;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPartner: boolean;
  role: string | null;
  login: (credentials: unknown) => Promise<unknown>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Derived state for partner check
  const isPartner = Boolean(user?.role === 'partner' || user?.is_partner);
  const role = user?.role || null;

  const refreshUser = async () => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      try {
        const res = await api.get("/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Merge user and role from response
        const userData = res.data.user || res.data;
        const userRole = res.data.role || userData.role;
        setUser({ ...userData, role: userRole });
      } catch {
        setUser(null);
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      api.get("/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          const userData = res.data.user || res.data;
          const userRole = res.data.role || userData.role;
          setUser({ ...userData, role: userRole });
        })
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Login function
  const login = async (credentials: unknown): Promise<unknown> => {
    try {
      await api.get("/sanctum/csrf-cookie");
      const res = await api.post("/api/login", credentials);

      localStorage.setItem("auth_token", res.data.token);

      // Store user with role
      const userData = res.data.user;
      const userRole = res.data.role || userData.role;
      setUser({ ...userData, role: userRole });

      showAlert({ type: "success", message: "Login successful!" });

      return res;
    } catch (error) {
      const errorResponse = error as { response?: { data?: { message?: string } } };
      showAlert({
        type: "error",
        message: errorResponse.response?.data?.message || "Login failed. Try again.",
      });

      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      const token = localStorage.getItem("auth_token");

      await api.post("/api/logout", null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      localStorage.removeItem("auth_token");
      setUser(null);

      showAlert({ type: "info", message: "Logged out successfully!" });
    } catch (error) {
      const errorResponse = error as { response?: { data?: { message?: string } } };
      showAlert({
        type: "error",
        message: errorResponse.response?.data?.message || "Logout failed. Try again.",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isPartner, role, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
