import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { User, RefreshCw, Check, AlertTriangle, LogOut } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useFocusEffect } from "expo-router";
import { PressableScale } from "@/components/PressableScale";

type UserData = { name: string; email: string; cycleLength: number };

export default function SettingsScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<UserData | null>(null);
  const [name, setName] = useState("");
  const [cycleLength, setCycleLength] = useState("28");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      setAnimKey((k) => k + 1);
    }, [])
  );

  const cycleLengthNum = parseInt(cycleLength, 10);
  const showWarning = !isNaN(cycleLengthNum) && cycleLengthNum > 35 && cycleLengthNum <= 45;

  useEffect(() => {
    async function load() {
      const res = await apiFetch("/api/settings");
      if (res.ok) {
        const user: UserData = await res.json();
        setData(user);
        setName(user.name);
        setCycleLength(String(user.cycleLength));
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    const length = parseInt(cycleLength, 10);
    if (isNaN(length) || length < 21 || length > 45) return;
    setSaving(true);
    const res = await apiFetch("/api/settings", {
      method: "PATCH",
      body: JSON.stringify({ name, cycleLength: length }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  }

  function handleLogout() {
    Alert.alert("Sair", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color="#7C6FCD" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, gap: 20 }}>
        <View>
          <Text className="text-2xl font-bold text-primary">Configurações</Text>
          <Text className="text-sm text-muted mt-1">Gerencie seu perfil e ciclo</Text>
        </View>

        <Animated.View
          key={`perfil-${animKey}`}
          entering={FadeInDown.duration(250)}
          className="bg-white rounded-2xl p-4 border border-border gap-4"
        >
          <View className="flex-row items-center gap-2">
            <User size={15} color="#7C6FCD" />
            <Text className="text-base font-semibold text-foreground">Perfil</Text>
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">Nome</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl text-foreground"
              style={{ height: 48, paddingHorizontal: 16, fontSize: 14 }}
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">Email</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl"
              value={data?.email ?? ""}
              editable={false}
              style={{ height: 48, paddingHorizontal: 16, fontSize: 14, color: "#9ca3af" }}
            />
            <Text className="text-xs text-muted">O email não pode ser alterado.</Text>
          </View>
        </Animated.View>

        <Animated.View
          key={`ciclo-${animKey}`}
          entering={FadeInDown.delay(50).duration(250)}
          className="bg-white rounded-2xl p-4 border border-border gap-4"
        >
          <View className="flex-row items-center gap-2">
            <RefreshCw size={15} color="#7C6FCD" />
            <Text className="text-base font-semibold text-foreground">Ciclo menstrual</Text>
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">
              Duração do ciclo (dias)
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl text-foreground w-24"
              style={{ height: 48, paddingHorizontal: 16, fontSize: 14 }}
              value={cycleLength}
              onChangeText={setCycleLength}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text className="text-xs text-muted">
              Do 1º dia da menstruação até o início da próxima. Média: 28 dias.
            </Text>

            {showWarning && (
              <View className="flex-row gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 mt-1">
                <AlertTriangle size={14} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
                <Text className="text-xs text-amber-800 flex-1">
                  Ciclos acima de 35 dias podem indicar{" "}
                  <Text className="font-semibold">oligomenorreia</Text> — associada a SOP,
                  hipotireoidismo ou alterações hormonais. Considere consultar um ginecologista.
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        <Animated.View
          key={`save-${animKey}`}
          entering={FadeInDown.delay(100).duration(250)}
        >
          <PressableScale
            onPress={handleSave}
            disabled={saving || saved}
            haptic
            className="rounded-2xl py-4 items-center flex-row justify-center gap-2"
            style={{ backgroundColor: saved ? "#E5E7EB" : "#7C6FCD", opacity: saving ? 0.7 : 1 }}
          >
          {saved ? (
            <>
              <Check size={15} color="#9ca3af" />
              <Text className="font-semibold text-sm" style={{ color: "#9ca3af" }}>
                Salvo!
              </Text>
            </>
          ) : (
            <Text className="text-white font-semibold text-sm">
              {saving ? "Salvando..." : "Salvar alterações"}
            </Text>
          )}
          </PressableScale>
        </Animated.View>

        <Animated.View
          key={`sair-${animKey}`}
          entering={FadeInDown.delay(150).duration(250)}
        >
          <PressableScale
            onPress={handleLogout}
            haptic
            className="rounded-2xl py-4 items-center flex-row justify-center gap-2 border border-red-200 bg-red-50"
          >
            <LogOut size={15} color="#ef4444" />
            <Text className="text-sm font-semibold text-red-500">Sair da conta</Text>
          </PressableScale>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
