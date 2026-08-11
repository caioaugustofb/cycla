import { useCallback, useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import * as SplashScreen from "expo-splash-screen";

export function AnimatedSplash({
  ready,
  onFinish,
}: {
  ready: boolean;
  onFinish: () => void;
}) {
  const containerOpacity = useSharedValue(1);
  const logoScale = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);
  const hidden = useRef(false);

  // Esconde a splash nativa (só o fundo lilás) e então toca a entrada da logo.
  // Fazer isto depois de esconder a nativa garante que o pop não fique "atrás" dela.
  const onLayout = useCallback(async () => {
    if (hidden.current) return;
    hidden.current = true;
    await SplashScreen.hideAsync();
    logoOpacity.value = withTiming(1, { duration: 300 });
    logoScale.value = withSpring(1, { damping: 11, stiffness: 130, mass: 1 });
  }, []);

  // Saída: leve zoom + fade do conjunto.
  useEffect(() => {
    if (!ready) return;
    const timing = { duration: 450, easing: Easing.out(Easing.quad) };
    logoScale.value = withTiming(1.15, timing);
    containerOpacity.value = withTiming(0, timing, (finished) => {
      if (finished) runOnJS(onFinish)();
    });
  }, [ready]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <Animated.View
      onLayout={onLayout}
      style={[StyleSheet.absoluteFill, styles.container, containerStyle]}
    >
      <Animated.Image
        source={require("../assets/logo-tela-inicial2.png")}
        style={[styles.logo, logoStyle]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  logo: {
    width: 240,
    height: 240,
  },
});
