import { View, Text, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { PressableScale } from "@/components/PressableScale";

export default function LandingScreen() {
  const router = useRouter();
  return (
    <LinearGradient
      colors={["#EDE9FE", "#E4E6FB", "#C4CAFC"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center px-6">
          <Image
            source={require("../assets/logo-tela-inicial2.png")}
            style={{ width: 300, height: 300 }}
            resizeMode="contain"
          />
          <Text
            className="text-base mb-10"
            style={{ color: "#7C6FCD", marginTop: -40, letterSpacing: 0.3 }}
          >
            Conecte-se com seu ciclo
          </Text>
          <PressableScale
            haptic
            onPress={() => router.push("/(auth)/register")}
            className="bg-primary w-full py-4 rounded-2xl items-center mb-3"
          >
            <Text className="text-white font-semibold text-base">Começar agora</Text>
          </PressableScale>
          <PressableScale
            onPress={() => router.push("/(auth)/login")}
            className="w-full py-4 rounded-2xl items-center"
          >
            <Text className="text-primary font-semibold text-base">Já tenho conta</Text>
          </PressableScale>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
