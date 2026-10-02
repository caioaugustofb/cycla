import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3100";

let unauthorizedHandler: (() => void) | null = null;
let handledToken: string | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function decodeBase64Url(input: string): string {
  let bits = 0;
  let buffer = 0;
  let output = "";
  for (const char of input.replace(/=+$/, "")) {
    const value = BASE64_CHARS.indexOf(char === "+" ? "-" : char === "/" ? "_" : char);
    if (value === -1) throw new Error("base64 inválido");
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

export function isTokenExpired(token: string): boolean {
  try {
    const { exp } = JSON.parse(decodeBase64Url(token.split(".")[1]));
    return typeof exp === "number" && exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem("@cycla:token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Várias chamadas em paralelo podem receber 401 juntas; trata uma vez por token.
  if (res.status === 401 && token && token !== handledToken) {
    handledToken = token;
    unauthorizedHandler?.();
  }

  return res;
}
