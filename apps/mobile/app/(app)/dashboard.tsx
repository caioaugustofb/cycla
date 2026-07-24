import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarDays, Zap, Timer, Check, Sparkles } from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CycleStatus, CyclePhase } from "@/lib/cycle-engine";
import { PressableScale } from "@/components/PressableScale";

const PHASE_IMAGES: Record<CyclePhase, ReturnType<typeof require>> = {
  menstrual: require("../../assets/phases/fase-menstrual.png"),
  follicular: require("../../assets/phases/fase-folicular.png"),
  ovulatory: require("../../assets/phases/fase-ovulatoria.png"),
  luteal: require("../../assets/phases/fase-lutea.png"),
};

// Cor forte (texto/ícones) + tint claro (fundos de badge/chip) por fase.
const PHASE_ACCENT: Record<CyclePhase, { color: string; tint: string }> = {
  menstrual: { color: "#D6456A", tint: "#FFE4EA" },
  follicular: { color: "#229268", tint: "#DFF3EA" },
  ovulatory: { color: "#A67C00", tint: "#F7EFCF" },
  luteal: { color: "#7C6FCD", tint: "#EAE3FB" },
};

const MOOD_OPTIONS = [
  { value: 1, label: "Péssimo" },
  { value: 2, label: "Ruim" },
  { value: 3, label: "Ok" },
  { value: 4, label: "Bem" },
  { value: 5, label: "Ótimo" },
];

const ENERGY_OPTIONS = [
  { value: 1, label: "Esgotada" },
  { value: 2, label: "Cansada" },
  { value: 3, label: "Estável" },
  { value: 4, label: "Disposta" },
  { value: 5, label: "Ativa" },
];

const SYMPTOM_OPTIONS = [
  "Cólica",
  "Fadiga",
  "Inchaço",
  "Dor de Cabeça",
  "Irritabilidade",
  "Humor instável",
];

type DailyLog = { mood: number | null; energy: number | null; symptoms: string[] };

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
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
  const [status, setStatus] = useState<CycleStatus | null>(null);
  const [log, setLog] = useState<DailyLog>({ mood: null, energy: null, symptoms: [] });
  const [saved, setSaved] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [noOnboarding, setNoOnboarding] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  // Colapso sincronizado: progress (0=fechado, 1=aberto) dirige altura E opacidade juntas.
  const collapseProgress = useSharedValue(1);
  const contentHeight = useSharedValue(0);
  const collapseStyle = useAnimatedStyle(() => {
    // Antes de medir a altura, não fixa height (auto) para o conteúdo poder ser medido.
    if (contentHeight.value === 0) {
      return { opacity: collapseProgress.value };
    }
    return {
      height: contentHeight.value * collapseProgress.value,
      opacity: collapseProgress.value,
    };
  });
  const collapseTiming = { duration: 450, easing: Easing.inOut(Easing.quad) };

  useEffect(() => {
    async function load() {
      const [cycleRes, logRes] = await Promise.all([
        apiFetch("/api/cycle/status"),
        apiFetch("/api/daily-log"),
      ]);

      if (cycleRes.status === 404) {
        setNoOnboarding(true);
        setLoading(false);
        return;
      }

      if (cycleRes.ok) setStatus(await cycleRes.json());
      if (logRes.ok) {
        const data = await logRes.json();
        if (data) {
          setLog(data);
          setSaved(true);
          setCollapsed(true);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  async function saveLog() {
    setSaving(true);
    const res = await apiFetch("/api/daily-log", {
      method: "POST",
      body: JSON.stringify(log),
    });
    if (res.ok) {
      setSaved(true);
      setCollapsed(true);
      collapseProgress.value = withTiming(0, collapseTiming);
    }
    setSaving(false);
  }

  function toggleSymptom(symptom: string) {
    setSaved(false);
    setLog((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom],
    }));
  }

  function registerPeriod() {
    const today = new Date().toLocaleDateString("pt-BR");
    Alert.alert(
      "Registrar menstruação",
      `Sua menstruação começou hoje, ${today}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            const iso = new Date().toISOString().split("T")[0];
            const res = await apiFetch("/api/cycle", {
              method: "POST",
              body: JSON.stringify({ startDate: iso }),
            });
            if (res.ok) {
              const cycleRes = await apiFetch("/api/cycle/status");
              if (cycleRes.ok) setStatus(await cycleRes.json());
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color="#7C6FCD" size="large" />
      </SafeAreaView>
    );
  }

  if (noOnboarding) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center px-6">
        <View className="bg-accent-light p-5 rounded-3xl mb-5">
          <Sparkles size={36} color="#7C6FCD" />
        </View>
        <Text className="text-xl font-bold text-primary text-center mb-2">
          Configure seu ciclo
        </Text>
        <Text className="text-sm text-muted text-center mb-6">
          Precisamos de algumas informações para calcular sua fase atual e personalizar o app para você.
        </Text>
        <PressableScale
          className="bg-primary rounded-2xl py-4 px-8 items-center w-full"
          onPress={() => router.push("/(auth)/onboarding")}
          haptic
        >
          <Text className="text-white font-semibold text-base">Configurar agora</Text>
        </PressableScale>
      </SafeAreaView>
    );
  }

  const firstName = user?.name?.split(" ")[0] ?? "";
  const activePhase: CyclePhase = status?.phase ?? "menstrual";
  const accent = PHASE_ACCENT[activePhase];
  const phaseImage = PHASE_IMAGES[activePhase];

  const nextPeriod = status
    ? new Date(status.nextPeriodDate).toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
      })
    : "";

  const hasSelection = log.mood !== null || log.energy !== null || log.symptoms.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ padding: 24, gap: 16 }}
      >
        <View>
          <Text className="text-muted text-sm">Olá, {firstName}</Text>
          <Text className="text-2xl font-bold text-foreground">Seu ciclo hoje</Text>
        </View>

        {status && (
          <Animated.View
            key={`phase-${animKey}`}
            entering={FadeInDown.duration(250)}
            className="bg-white rounded-2xl p-5 gap-3 border border-border"
          >
            <View className="flex-row items-center justify-between">
              <Image
                source={phaseImage}
                style={{ width: 88, height: 88 }}
                resizeMode="contain"
              />
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: accent.tint }}
              >
                <Text className="text-xs font-medium" style={{ color: accent.color }}>
                  Dia {status.currentDay} do ciclo
                </Text>
              </View>
            </View>
            <View>
              <Text className="text-xl font-bold" style={{ color: accent.color }}>
                Fase {status.phaseInfo.name}
              </Text>
              <Text className="text-sm text-foreground-secondary mt-1">
                {status.phaseInfo.description}
              </Text>
            </View>
            <View className="flex-row gap-3 mt-1">
              <View
                className="rounded-xl px-3 py-2 flex-row items-center gap-2"
                style={{ backgroundColor: accent.tint }}
              >
                <Zap size={14} color={accent.color} />
                <View>
                  <Text className="text-xs" style={{ color: accent.color }}>Energia</Text>
                  <Text className="text-sm font-semibold text-foreground">
                    {status.phaseInfo.energy}
                  </Text>
                </View>
              </View>
              <View
                className="rounded-xl px-3 py-2 flex-row items-center gap-2"
                style={{ backgroundColor: accent.tint }}
              >
                <Timer size={14} color={accent.color} />
                <View>
                  <Text className="text-xs" style={{ color: accent.color }}>Dias restantes</Text>
                  <Text className="text-sm font-semibold text-foreground">
                    {status.daysLeftInPhase} dias
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        <Animated.View
          key={`next-${animKey}`}
          entering={FadeInDown.delay(50).duration(250)}
          className="bg-white rounded-2xl px-4 py-4 flex-row items-center justify-between border border-border"
        >
          <View>
            <Text className="text-xs text-muted">Próxima menstruação</Text>
            <Text className="text-sm font-semibold text-foreground">{nextPeriod}</Text>
          </View>
          <CalendarDays size={20} color="#7C6FCD" />
        </Animated.View>

        <Animated.View
          key={`reg-${animKey}`}
          entering={FadeInDown.delay(100).duration(250)}
        >
          <PressableScale
            className="bg-surface-card rounded-2xl px-4 py-4 flex-row items-center justify-between border border-border"
            onPress={registerPeriod}
            haptic
          >
            <View>
              <Text className="text-xs text-muted">Menstruação chegou?</Text>
              <Text className="text-sm font-semibold text-foreground">Registrar novo ciclo</Text>
            </View>
            <View className="bg-accent-light p-2 rounded-xl">
              <CalendarDays size={18} color="#7C6FCD" />
            </View>
          </PressableScale>
        </Animated.View>

        <Animated.View
          key={`mood-${animKey}`}
          entering={FadeInDown.delay(150).duration(250)}
          className="bg-white rounded-2xl p-5 border border-border"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-foreground">Como você está hoje?</Text>
            {saved && (
              <View className="flex-row items-center gap-1">
                <Check size={14} color="#7C6FCD" />
                <Text className="text-sm text-primary">Salvo</Text>
              </View>
            )}
          </View>

          <Animated.View style={[collapseStyle, { overflow: "hidden" }]}>
            <View
              onLayout={(e) => {
                const h = e.nativeEvent.layout.height;
                if (h > 0 && contentHeight.value !== h) {
                  contentHeight.value = h;
                  // Se o card deve iniciar colapsado, colapsa após medir (sem animar).
                  if (collapsed && collapseProgress.value === 1) {
                    collapseProgress.value = 0;
                  }
                }
              }}
            >
              <View className="gap-5 pt-5">
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Humor</Text>
            <View className="flex-row gap-2">
              {MOOD_OPTIONS.map((opt) => (
                <PressableScale
                  key={opt.value}
                  onPress={() => {
                    setLog((prev) => ({ ...prev, mood: opt.value }));
                    setSaved(false);
                  }}
                  className="flex-1 py-2 rounded-xl items-center border"
                  style={{
                    backgroundColor: log.mood === opt.value ? "#7C6FCD" : "#F5F0FF",
                    borderColor: log.mood === opt.value ? "#7C6FCD" : "rgba(124,111,205,0.15)",
                  }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: log.mood === opt.value ? "#fff" : "#9ca3af" }}
                  >
                    {opt.label}
                  </Text>
                </PressableScale>
              ))}
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Energia</Text>
            <View className="flex-row gap-2">
              {ENERGY_OPTIONS.map((opt) => (
                <PressableScale
                  key={opt.value}
                  onPress={() => {
                    setLog((prev) => ({ ...prev, energy: opt.value }));
                    setSaved(false);
                  }}
                  className="flex-1 py-2 rounded-xl items-center border"
                  style={{
                    backgroundColor: log.energy === opt.value ? "#7C6FCD" : "#F5F0FF",
                    borderColor: log.energy === opt.value ? "#7C6FCD" : "rgba(124,111,205,0.15)",
                  }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: log.energy === opt.value ? "#fff" : "#9ca3af" }}
                  >
                    {opt.label}
                  </Text>
                </PressableScale>
              ))}
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">
              Sintomas{" "}
              <Text className="text-muted font-normal">(Opcional)</Text>
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {SYMPTOM_OPTIONS.map((symptom) => (
                <PressableScale
                  key={symptom}
                  onPress={() => toggleSymptom(symptom)}
                  className="px-3 py-1.5 rounded-full border"
                  style={{
                    backgroundColor: log.symptoms.includes(symptom) ? "#7C6FCD" : "#F5F0FF",
                    borderColor: log.symptoms.includes(symptom)
                      ? "#7C6FCD"
                      : "rgba(124,111,205,0.15)",
                  }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{
                      color: log.symptoms.includes(symptom) ? "#fff" : "#9ca3af",
                    }}
                  >
                    {symptom}
                  </Text>
                </PressableScale>
              ))}
            </View>
          </View>
              </View>
            </View>
          </Animated.View>

          <View className="mt-5">
            {collapsed ? (
              <PressableScale
                onPress={() => {
                  setCollapsed(false);
                  collapseProgress.value = withTiming(1, collapseTiming);
                  setTimeout(
                    () => scrollRef.current?.scrollToEnd({ animated: true }),
                    450
                  );
                }}
                haptic
                className="rounded-2xl py-3.5 items-center border border-border"
              >
                <Text className="font-semibold text-sm text-primary">Editar</Text>
              </PressableScale>
            ) : (
              <PressableScale
                onPress={saveLog}
                disabled={saving || !hasSelection}
                haptic
                className="rounded-2xl py-3.5 items-center"
                style={{
                  backgroundColor: saving || !hasSelection ? "#E5E7EB" : "#7C6FCD",
                }}
              >
                <Text
                  className="font-semibold text-sm"
                  style={{ color: saving || !hasSelection ? "#9ca3af" : "#fff" }}
                >
                  {saving ? "Salvando..." : "Salvar registro"}
                </Text>
              </PressableScale>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
