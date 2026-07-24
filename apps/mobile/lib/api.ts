import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE = __DEV__ ? "http://localhost:3000" : "https://sua-api.com";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem("@cycla:token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(`${API_BASE}${path}`, { ...options, headers });
}
