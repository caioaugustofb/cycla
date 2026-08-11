import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { Moon } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { PressableScale } from "@/components/PressableScale";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError("Preencha email e senha");
      return;
    }
    setError("");
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.replace("/(app)/dashboard");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6 py-10">
            <View className="items-center mb-8">
              <View className="bg-accent-light p-4 rounded-3xl mb-4">
                <Moon size={32} color="#7C6FCD" />
              </View>
              <Text className="text-3xl font-bold text-primary">Cycla</Text>
              <Text className="text-base text-muted mt-1">Entre na sua conta</Text>
            </View>

            <View className="flex flex-col gap-4">
              <View>
                <Text className="text-sm font-medium text-foreground mb-1.5">Email</Text>
                <TextInput
                  className="bg-white border border-border rounded-xl text-foreground"
                  style={{ height: 48, paddingHorizontal: 16, fontSize: 14 }}
                  placeholder="seu@email.com"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-1.5">Senha</Text>
                <TextInput
                  className="bg-white border border-border rounded-xl text-foreground"
                  style={{ height: 48, paddingHorizontal: 16, fontSize: 14 }}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                />
              </View>

              {error ? (
                <Text className="text-xs text-red-500 text-center">{error}</Text>
              ) : null}

              <PressableScale
                className="bg-primary rounded-2xl py-4 items-center mt-2"
                onPress={handleLogin}
                disabled={loading}
                haptic
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">Entrar</Text>
                )}
              </PressableScale>
            </View>

            <Text className="text-center text-sm text-muted mt-6">
              Não tem conta?{" "}
              <Link href="/(auth)/register">
                <Text className="text-primary font-semibold">Criar conta</Text>
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
