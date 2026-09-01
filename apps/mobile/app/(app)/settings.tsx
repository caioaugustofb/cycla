import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  Linking,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  User,
  RefreshCw, 
  Check, 
  AlertTriangle, 
  LogOut,
  Repeat,
  ChevronRight,
  Bell,
 } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useFocusEffect } from "expo-router";
import { PressableScale } from "@/components/PressableScale";
import { useToast } from "@/components/Toast";
import {
  getExerciseRemindersEnabled,
  setExerciseRemindersEnabled,
  getPeriodRemindersEnabled,
  setPeriodRemindersEnabled,
} from "@/lib/notification-prefs";
import {
  scheduleExerciseReminders,
  disableExerciseReminders,
  schedulePeriodReminders,
  disablePeriodReminders,
} from "@/lib/notifications";

type UserData = { name: string; email: string; cycleLength: number };

export default function SettingsScreen() {
  const { logout } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [data, setData] = useState<UserData | null>(null);
  const [name, setName] = useState("");
  const [remindersOn, setRemindersOn] = useState(false);
  const [togglingReminders, setTogglingReminders] = useState(false);
  const [periodRemindersOn, setPeriodRemindersOn] = useState(false);
  const [togglingPeriod, setTogglingPeriod] = useState(false);
  useEffect(() => {
    getExerciseRemindersEnabled().then(setRemindersOn);
    getPeriodRemindersEnabled().then(setPeriodRemindersOn);
  }, []);

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
    if (!name.trim()) {
      toast.error("Informe seu nome.");
      return;
    }

    const length = parseInt(cycleLength, 10);
    if (isNaN(length)) {
      toast.error("Informe a duração do ciclo em dias.");
      return;
    }
    if (!__DEV__ && (length < 21 || length > 45)) {
      toast.error("A duração do ciclo deve ficar entre 21 e 45 dias.");
      return;
    }

    setSaving(true);
    const res = await apiFetch("/api/settings", {
      method: "PATCH",
      body: JSON.stringify({ name, cycleLength: length }),
    });
    if (res.ok) {
      setData((prev) => (prev ? { ...prev, name, cycleLength: length } : prev));
      setSaved(true);
      toast.success("Alterações salvas.");
      setTimeout(() => setSaved(false), 2500);
    } else {
      toast.error("Não foi possível salvar. Tente novamente.");
    }
    setSaving(false);
  }

  function reportScheduleFailure(reason: "permission" | "no-cycle" | "error") {
    if (reason === "permission") {
      Alert.alert(
        "Permissão necessária",
        "Ative as notificações para o Cycla nas configurações do seu aparelho.",
        [
          { text: "Agora não", style: "cancel" },
          { text: "Abrir configurações", onPress: () => Linking.openSettings() },
        ],
      );
    } else if (reason === "no-cycle") {
      Alert.alert(
        "Ciclo não encontrado",
        "Registre a data da sua última menstruação para receber os lembretes.",
      );
    } else {
      Alert.alert("Não foi possível ativar", "Verifique sua conexão e tente novamente.");
    }
  }

  async function handleToggleReminders(value: boolean) {
    setTogglingReminders(true);
    if (value) {
      const result = await scheduleExerciseReminders();
      if (!result.ok) {
        reportScheduleFailure(result.reason);
        setTogglingReminders(false);
        return;
      }
      setRemindersOn(true);
      await setExerciseRemindersEnabled(true);
    } else {
      await disableExerciseReminders();
      setRemindersOn(false);
      await setExerciseRemindersEnabled(false);
    }
    setTogglingReminders(false);
  }

  async function handleTogglePeriodReminders(value: boolean) {
    setTogglingPeriod(true);
    if (value) {
      const result = await schedulePeriodReminders();
      if (!result.ok) {
        reportScheduleFailure(result.reason);
        setTogglingPeriod(false);
        return;
      }
      setPeriodRemindersOn(true);
      await setPeriodRemindersEnabled(true);
    } else {
      await disablePeriodReminders();
      setPeriodRemindersOn(false);
      await setPeriodRemindersEnabled(false);
    }
    setTogglingPeriod(false);
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
      <KeyboardAwareScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, gap: 20 }} bottomOffset={20} keyboardShouldPersistTaps="handled">
        <View>
          <Text className="text-2xl font-bold text-primary">Configurações</Text>
          <Text className="text-base text-muted mt-1">Gerencie seu perfil e ciclo</Text>
        </View>

        <Animated.View
          key={`perfil-${animKey}`}
          entering={FadeInDown.duration(250)}
          className="bg-white rounded-2xl p-4 border border-border gap-4"
        >
          <View className="flex-row items-center gap-2">
            <User size={18} color="#7C6FCD" />
            <Text className="text-lg font-semibold text-foreground">Perfil</Text>
          </View>

          <View className="gap-1.5">
            <Text className="text-base font-medium text-foreground">Nome</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl text-foreground"
              style={{ height: 48, paddingHorizontal: 16, fontSize: 16 }}
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-base font-medium text-foreground">Email</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl"
              value={data?.email ?? ""}
              editable={false}
              style={{ height: 48, paddingHorizontal: 16, fontSize: 16, color: "#9ca3af" }}
            />
            <Text className="text-sm text-muted">O email não pode ser alterado.</Text>
          </View>
        </Animated.View>

        <Animated.View
          key={`ciclo-${animKey}`}
          entering={FadeInDown.delay(50).duration(250)}
          className="bg-white rounded-2xl p-4 border border-border gap-4"
        >
          <View className="flex-row items-center gap-2">
            <RefreshCw size={18} color="#7C6FCD" />
            <Text className="text-lg font-semibold text-foreground">Ciclo menstrual</Text>
          </View>

          <View className="gap-1.5">
            <Text className="text-base font-medium text-foreground">
              Duração do ciclo (dias)
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl text-foreground w-16"
              style={{ height: 40, paddingHorizontal: 8, fontSize: 16, textAlign: "center" }}
              value={cycleLength}
              onChangeText={setCycleLength}
              onBlur={() => {
                if (cycleLength.trim() === "") setCycleLength(String(data?.cycleLength ?? 28));
              }}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text className="text-sm text-muted">
              Do 1º dia da menstruação até o início da próxima. Média: 28 dias.
            </Text>

            {showWarning && (
              <View className="flex-row gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 mt-1">
                <AlertTriangle size={16} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
                <Text className="text-sm text-amber-800 flex-1">
                  Ciclos acima de 35 dias podem indicar{" "}
                  <Text className="font-semibold">oligomenorreia</Text> — associada a SOP,
                  hipotireoidismo ou alterações hormonais. Considere consultar um ginecologista.
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        <Animated.View
          key={`notif-${animKey}`}
          entering={FadeInDown.delay(100).duration(250)}
          className="bg-white rounded-2xl p-4 border border-border gap-4"
        >
          <View className="flex-row items-center gap-2">
            <Bell size={18} color="#7C6FCD" />
            <Text className="text-lg font-semibold text-foreground">Notificações</Text>
          </View>

          <View className="flex-row items-center">
            <View className="flex-1 mr-3">
              <Text className="text-base font-medium text-foreground">Lembretes de treino</Text>
              <Text className="text-sm text-muted mt-0.5">
                Mensagens que acompanham a fase do seu ciclo.
              </Text>
            </View>
            <Switch
              value={remindersOn}
              onValueChange={handleToggleReminders}
              disabled={togglingReminders}
              trackColor={{ false: "#E5E7EB", true: "#7C6FCD" }}
              thumbColor="#fff"
            />
          </View>

          <View className="h-px bg-border" />

          <View className="flex-row items-center">
            <View className="flex-1 mr-3">
              <Text className="text-base font-medium text-foreground">
                Aviso de menstruação
              </Text>
              <Text className="text-sm text-muted mt-0.5">
                Avisos alguns dias antes e na véspera da data prevista.
              </Text>
            </View>
            <Switch
              value={periodRemindersOn}
              onValueChange={handleTogglePeriodReminders}
              disabled={togglingPeriod}
              trackColor={{ false: "#E5E7EB", true: "#7C6FCD" }}
              thumbColor="#fff"
            />
          </View>
        </Animated.View>

        <Animated.View
          key={`habits-${animKey}`}
          entering={FadeInDown.delay(150).duration(250)}
        >
          <PressableScale
            onPress={() => router.push("/habits")}
            className="bg-white rounded-2xl p-4 border border-border"
          >
            <View className="flex-row items-center">
              <View className="bg-accent-light rounded-xl p-2.5">
                <Repeat size={20} color="#7C6FCD" />
              </View>

              <View className="flex-1 ml-3">
                <Text className="text-lg font-semibold text-foreground">
                  Hábitos
                </Text>
                <Text className="text-sm text-muted mt-0.5">
                  Configure hábitos para cada fase
                </Text>
              </View>

              <ChevronRight size={20} color="#9CA3AF" />
            </View>
          </PressableScale>
        </Animated.View>

        <Animated.View
          key={`save-${animKey}`}
          entering={FadeInDown.delay(200).duration(250)}
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
              <Check size={18} color="#9ca3af" />
              <Text className="font-semibold text-base" style={{ color: "#9ca3af" }}>
                Salvo!
              </Text>
            </>
          ) : (
            <Text className="text-white font-semibold text-base">
              {saving ? "Salvando..." : "Salvar alterações"}
            </Text>
          )}
          </PressableScale>
        </Animated.View>

        <Animated.View
          key={`sair-${animKey}`}
          entering={FadeInDown.delay(250).duration(250)}
        >
          <PressableScale
            onPress={handleLogout}
            haptic
            className="rounded-2xl py-4 items-center flex-row justify-center gap-2 border border-red-200 bg-red-50"
          >
            <LogOut size={18} color="#ef4444" />
            <Text className="text-base font-semibold text-red-500">Sair da conta</Text>
          </PressableScale>
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
