import React from "react";
import {
  Pressable,
  PressableProps,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

type Props = Omit<PressableProps, "children" | "style"> & {
  haptic?: boolean;
  className?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function PressableScale({
  haptic = false,
  onPressIn,
  onPressOut,
  style,
  className,
  children,
  ...rest
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const timing = { duration: 120, easing: Easing.out(Easing.quad) };

  return (
    <Animated.View className={className} style={[animatedStyle, style]}>
      {children}
      <Pressable
        onPressIn={(e) => {
          scale.value = withTiming(0.97, timing);
          if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          scale.value = withTiming(1, timing);
          onPressOut?.(e);
        }}
        style={StyleSheet.absoluteFill}
        {...rest}
      />
    </Animated.View>
  );
}
