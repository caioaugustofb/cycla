import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const LETTER_STAGGER = 55;
const LETTER_DURATION = 320;
// Espera o fade-out do splash (que está por cima) antes das letras entrarem.
const START_DELAY = 350;

export function GreetingScreen({
  name,
  onFinish,
}: {
  name: string,
  onFinish: () => void;
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const letters = greeting.split("");

  const greetingEnd = START_DELAY + (letters.length - 1) * LETTER_STAGGER + LETTER_DURATION;
  const nameDelay = greetingEnd + 100;
  const holdUntil = nameDelay + 400 + 700;

  const opacity = useSharedValue(1);

  useEffect(() => {
    const t = setTimeout(() => {
      opacity.value = withTiming(
        0,
        { duration: 400, easing: Easing.out(Easing.quad) },
        (finished) => {
          if (finished) runOnJS(onFinish)();
        }
      );
    }, holdUntil);
    return () => clearTimeout(t);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.wrapper, containerStyle]}>
      <LinearGradient
        colors={["#EDE9FE", "#E4E6FB", "#C4CAFC"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.center}>
        <View style={styles.row}>
          {letters.map((char, i) => (
            <Animated.Text
              key={i}
              entering={FadeInDown.delay(START_DELAY + i * LETTER_STAGGER).duration(LETTER_DURATION)}
              style={styles.greetingText}
            >
              {char === " " ? "\u00A0" : char}
            </Animated.Text>
          ))}
        </View>
        <Animated.Text
          entering={FadeInDown.delay(nameDelay).duration(400)}
          style={styles.nameText}
        >
          {name}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { zIndex: 5 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row" },
  greetingText: { fontSize: 24, fontWeight: "700", color: "#111827" },
  nameText: { fontSize: 34, fontWeight: "600", color: "#7C6FCD", marginTop: 4 },
});