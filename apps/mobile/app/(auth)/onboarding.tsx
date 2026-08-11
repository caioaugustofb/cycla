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
import { useRouter } from "expo-router";
import { Sparkles, AlertTriangle } from "lucide-react-native";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PressableScale } from "@/components/PressableScale";

export default function OnboardingScreen() {
  const router = useRouter();
  const { finalizeLogin } = useAuth();
  const [lastPeriodDate, setLastPeriodDate] = useState("");
  const [cycleLength, setCycleLength] = useState("28");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const cycleLengthNum = parseInt(cycleLength, 10);
  const showOligomenorrheaWarning =
    !isNaN(cycleLengthNum) && cycleLengthNum > 35 && cycleLengthNum <= 45;

  function formatDateInput(text: string) {
    const digits = text.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }

  function parseDate(value: string): string | null {
    const parts = value.split("/");
    if (parts.length !== 3) return null;
    const [day, month, year] = parts;
    if (!day || !month || !year || year.length !== 4) return null;
    const d = new Date(`${year}-${month}-${day}`);
    if (isNaN(d.getTime())) return null;
    return `${year}-${month}-${day}`;
  }

  async function handleSubmit() {
    setError("");

    const parsedDate = parseDate(lastPeriodDate);
    if (!parsedDate) {
      setError("Informe a data no formato DD/MM/AAAA");
      return;
    }

    const length = parseInt(cycleLength, 10);
    if (isNaN(length) || length < 21 || length > 45) {
      setError("Duração do ciclo deve ser entre 21 e 45 dias");
      return;
    }

    setLoading(true);
    const res = await apiFetch("/api/onboarding", {
      method: "POST",
      body: JSON.stringify({ lastPeriodDate: parsedDate, cycleLength: length }),
    });
    setLoading(false);

    if (!res.ok) {
      setError("Erro ao salvar. Tente novamente.");
      return;
    }

    await finalizeLogin();
    router.replace("/(app)/dashboard");
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
                <Sparkles size={32} color="#7C6FCD" />
              </View>
              <Text className="text-3xl font-bold text-primary">Quase lá!</Text>
              <Text className="text-base text-muted mt-1 text-center">
                Vamos configurar seu ciclo
              </Text>
            </View>

            <View className="flex flex-col gap-5">
              <View>
                <Text className="text-sm font-medium text-foreground mb-1.5">
                  Quando começou sua última menstruação?
                </Text>
                <TextInput
                  className="bg-white border border-border rounded-xl text-foreground"
                  style={{ height: 48, paddingHorizontal: 16, fontSize: 14 }}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#9ca3af"
                  value={lastPeriodDate}
                  onChangeText={(text) => setLastPeriodDate(formatDateInput(text))}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-1.5">
                  Duração do seu ciclo (dias)
                </Text>
                <TextInput
                  className="bg-white border border-border rounded-xl text-foreground w-28"
                  style={{ height: 48, paddingHorizontal: 16, fontSize: 14 }}
                  placeholder="28"
                  placeholderTextColor="#9ca3af"
                  value={cycleLength}
                  onChangeText={setCycleLength}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text className="text-xs text-muted mt-1.5">
                  Do 1º dia da menstruação até o início da próxima. Média: 28 dias.
                </Text>

                {showOligomenorrheaWarning && (
                  <View className="flex-row gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 mt-2">
                    <AlertTriangle size={14} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
                    <Text className="text-xs text-amber-800 flex-1">
                      Ciclos acima de 35 dias podem indicar{" "}
                      <Text className="font-semibold">oligomenorreia</Text> — associada a SOP,
                      hipotireoidismo ou alterações hormonais. Considere consultar um ginecologista.
                    </Text>
                  </View>
                )}
              </View>

              {error ? (
                <Text className="text-xs text-red-500 text-center">{error}</Text>
              ) : null}

              <PressableScale
                className="bg-primary rounded-2xl py-4 items-center mt-2"
                onPress={handleSubmit}
                disabled={loading}
                haptic
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">Começar</Text>
                )}
              </PressableScale>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
