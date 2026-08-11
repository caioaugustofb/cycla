import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "@/lib/api";

type User = { id: string; name: string; email: string };

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  finalizeLogin: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      const storedToken = await AsyncStorage.getItem("@cycla:token");
      const storedUser = await AsyncStorage.getItem("@cycla:user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    }
    restore();
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error ?? "Erro ao fazer login" };
    }

    await AsyncStorage.setItem("@cycla:token", data.token);
    await AsyncStorage.setItem("@cycla:user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return {};
  }

  async function register(name: string, email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error ?? "Erro ao criar conta" };
    }

    const tokenRes = await fetch(`${API_BASE}/api/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return { error: tokenData.error ?? "Conta criada, mas erro ao fazer login" };
    }

    await AsyncStorage.setItem("@cycla:token", tokenData.token);
    await AsyncStorage.setItem("@cycla:user", JSON.stringify(tokenData.user));

    return {};
  }

  async function finalizeLogin() {
    const storedToken = await AsyncStorage.getItem("@cycla:token");
    const storedUser = await AsyncStorage.getItem("@cycla:user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }

  async function logout() {
    await AsyncStorage.removeItem("@cycla:token");
    await AsyncStorage.removeItem("@cycla:user");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, finalizeLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
