import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { Check, AlertCircle, Info } from "lucide-react-native";

type ToastType = "success" | "error" | "info";

type ToastState = { id: number; type: ToastType; message: string } | null;

const TOAST_STYLES: Record<
  ToastType,
  { bg: string; border: string; color: string }
> = {
  success: { bg: "#ECFDF5", border: "#A7F3D0", color: "#047857" },
  error: { bg: "#FEF2F2", border: "#FECACA", color: "#B91C1C" },
  info: { bg: "#F5F0FF", border: "#DDD6FE", color: "#7C6FCD" },
};

const DURATION = 3000;

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const show = useCallback((type: ToastType, message: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), type, message });
    timer.current = setTimeout(() => setToast(null), DURATION);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message: string) => show("success", message),
      error: (message: string) => show("error", message),
      info: (message: string) => show("info", message),
    }),
    [show],
  );

  const style = toast ? TOAST_STYLES[toast.type] : null;

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast && style && (
        <Animated.View
          key={toast.id}
          entering={FadeInUp.duration(220)}
          exiting={FadeOutUp.duration(160)}
          pointerEvents="none"
          style={{
            position: "absolute",
            top: insets.top + 8,
            left: 16,
            right: 16,
            zIndex: 999,
            backgroundColor: style.bg,
            borderColor: style.border,
            borderWidth: 1,
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}
        >
          {toast.type === "success" && <Check size={18} color={style.color} />}
          {toast.type === "error" && <AlertCircle size={18} color={style.color} />}
          {toast.type === "info" && <Info size={18} color={style.color} />}
          <Text
            style={{ color: style.color, fontSize: 15, fontWeight: "500", flex: 1 }}
          >
            {toast.message}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast precisa estar dentro de um ToastProvider");
  }
  return ctx;
}
