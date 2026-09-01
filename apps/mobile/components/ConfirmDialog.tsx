import { useEffect } from "react";
import { View, Text, Modal, Pressable, useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { AlertTriangle } from "lucide-react-native";
import { PressableScale } from "@/components/PressableScale";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  const accent = destructive ? "#DC2626" : "#7C6FCD";
  const tint = destructive ? "#FEF2F2" : "#F5F0FF";
  const { width, height } = useWindowDimensions();

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: visible ? 200 : 140,
      easing: Easing.out(Easing.quad),
    });
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.95 + progress.value * 0.05 }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onCancel}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            width,
            height,
            backgroundColor: "rgba(17,24,39,0.45)",
          },
          backdropStyle,
        ]}
      >
        <Pressable style={{ width, height }} onPress={onCancel} />
      </Animated.View>

      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          alignItems: "center",
          justifyContent: "center",
          padding: 28,
        }}
      >
        <Animated.View
          style={[
            {
              width: "100%",
              backgroundColor: "#fff",
              borderRadius: 24,
              padding: 22,
              alignItems: "center",
            },
            cardStyle,
          ]}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: tint,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <AlertTriangle size={24} color={accent} />
          </View>

          <Text className="text-lg font-semibold text-foreground text-center">
            {title}
          </Text>
          <Text className="text-base text-muted text-center mt-2">{message}</Text>

          <View className="flex-row gap-3 mt-6 w-full">
            <PressableScale
              onPress={onCancel}
              className="flex-1 rounded-2xl py-3.5 items-center border border-border"
            >
              <Text className="text-base font-semibold text-muted">{cancelLabel}</Text>
            </PressableScale>
            <PressableScale
              onPress={onConfirm}
              haptic
              className="flex-1 rounded-2xl py-3.5 items-center"
              style={{ backgroundColor: accent }}
            >
              <Text className="text-base font-semibold text-white">{confirmLabel}</Text>
            </PressableScale>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
