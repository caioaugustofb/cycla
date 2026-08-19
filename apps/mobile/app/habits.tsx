import { useEffect, useState } from "react";
import { View, Text, TextInput, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Plus, X } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { apiFetch } from "@/lib/api";
import { PressableScale } from "@/components/PressableScale";
import { HABIT_SUGGESTIONS } from "@/lib/habit-suggestions";
import { CyclePhase } from "@cycla/core";

type Habit = { id: string; phase: string; text: string };

const PHASES: { value: CyclePhase; label: string; description: string }[] = [
  { value: "menstrual", label: "Menstrual", description: "Energia baixa e corpo pedindo descanso. É comum sentir cansaço, cólicas e vontade de se recolher. Prefira hábitos leves, de autocuidado e recuperação." },
  { value: "follicular", label: "Folicular", description: "A energia volta a subir, com mais disposição, foco e ânimo. Bom momento para hábitos que exigem iniciativa e aprendizado." },
  { value: "ovulatory", label: "Ovulatória", description: "Pico de energia, confiança e sociabilidade. Aproveite para hábitos mais intensos, sociais e que exijam exposição." },
  { value: "luteal", label: "Lútea", description: "A energia começa a cair e o foco fica mais interno. Podem surgir TPM, irritabilidade e cansaço. Priorize organização, rotina e autocuidado." },
];

function PhaseSelector({
  value,
  onChange,
}: {
  value: CyclePhase;
  onChange: (phase: CyclePhase) => void;
}) {
  return (
    <View className="flex-row bg-white rounded-2xl p-1 border border-border">
      {PHASES.map((p) => {
        const active = p.value === value;
        return (
          <Pressable
            key={p.value}
            onPress={() => onChange(p.value)}
            className="flex-1 rounded-xl py-2 items-center"
            style={{ backgroundColor: active ? "#7C6FCD" : "transparent" }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: active ? "#ffffff" : "#9ca3af" }}
            >
              {p.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function HabitsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phase?: string; locked?: string }>();
  const initialPhase = (PHASES.find((p) => p.value === params.phase)?.value ?? "menstrual") as CyclePhase;

  const [habits, setHabits] = useState<Habit[]>([]);
  const [phase, setPhase] = useState<CyclePhase>(initialPhase);
  const [loading, setLoading] = useState(true);
  const [customText, setCustomText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await apiFetch("/api/habits");
      if (res.ok) setHabits(await res.json());
      setLoading(false);
    }
    load();
  }, []);

  const phaseHabits = habits.filter((h) => h.phase === phase);
  const usedTexts = new Set(phaseHabits.map((h) => h.text.toLowerCase()));
  const suggestions = (HABIT_SUGGESTIONS[phase] ?? []).filter(
    (s) => !usedTexts.has(s.toLowerCase())
  );
  const phaseDescription = PHASES.find((p) => p.value === phase)?.description ?? "";
  const phaseLabel = PHASES.find((p) => p.value === phase)?.label ?? "";
  const locked = params.locked === "1";

  async function addHabit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    const res = await apiFetch("/api/habits", {
      method: "POST",
      body: JSON.stringify({ phase, text: trimmed }),
    });
    if (res.ok) {
      const created: Habit = await res.json();
      setHabits((prev) => [...prev, created]);
    }
    setBusy(false);
  }

  async function removeHabit(id: string) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    await apiFetch(`/api/habits/${id}`, { method: "DELETE" });
  }

  async function handleAddCustom() {
    await addHabit(customText);
    setCustomText("");
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
        <View className="flex-row items-center gap-2">
          <PressableScale onPress={() => router.back()} className="p-1 -ml-1">
            <ChevronLeft size={24} color="#111827" />
          </PressableScale>
          <View>
            <Text className="text-2xl font-bold text-primary">Hábitos</Text>
            <Text className="text-sm text-muted">{locked ? "Hábitos da sua fase atual" : "Mapeie hábitos para cada fase"}</Text>
          </View>
        </View>

        {locked ? (
          <View className="bg-accent-light rounded-2xl p-3 gap-1">
            <Text className="text-sm font-semibold text-primary">Fase {phaseLabel}</Text>
            <Text className="text-xs text-muted leading-4">
              Você está editando os hábitos da sua fase atual. Para configurar outras fases, acesse Config › Hábitos.
            </Text>
          </View>
        ) : (
          <PhaseSelector value={phase} onChange={setPhase} />
        )}

        <Text className="text-sm text-muted leading-5">{phaseDescription}</Text>

        <Animated.View
          key={`mine-${phase}`}
          entering={FadeInDown.duration(200)}
          className="bg-white rounded-2xl p-4 border border-border gap-3"
        >
          <Text className="text-base font-semibold text-foreground">Meus hábitos</Text>
          {phaseHabits.length === 0 ? (
            <Text className="text-sm text-muted">
              Nenhum hábito nesta fase ainda. Adicione um abaixo ou use as sugestões.
            </Text>
          ) : (
            phaseHabits.map((h) => (
              <View
                key={h.id}
                className="flex-row items-center justify-between bg-surface rounded-xl px-3 py-2.5"
              >
                <Text className="text-sm text-foreground flex-1">{h.text}</Text>
                <PressableScale onPress={() => removeHabit(h.id)} className="p-1">
                  <X size={16} color="#9ca3af" />
                </PressableScale>
              </View>
            ))
          )}

          <View className="flex-row items-center gap-2 mt-1">
            <TextInput
              className="flex-1 bg-surface border border-border rounded-xl text-foreground"
              style={{ height: 44, paddingHorizontal: 14, fontSize: 14 }}
              value={customText}
              onChangeText={setCustomText}
              placeholder="Criar hábito próprio"
              placeholderTextColor="#9ca3af"
              onSubmitEditing={handleAddCustom}
              returnKeyType="done"
            />
            <PressableScale
              onPress={handleAddCustom}
              haptic
              disabled={!customText.trim() || busy}
              className="rounded-xl items-center justify-center"
              style={{ backgroundColor: "#7C6FCD", width: 44, height: 44, opacity: customText.trim() ? 1 : 0.5 }}
            >
              <Plus size={20} color="#ffffff" />
            </PressableScale>
          </View>
        </Animated.View>

        {suggestions.length > 0 && (
          <Animated.View
            key={`sug-${phase}`}
            entering={FadeInDown.delay(50).duration(200)}
            className="bg-white rounded-2xl p-4 border border-border gap-3"
          >
            <Text className="text-base font-semibold text-foreground">Sugestões</Text>
            <View className="gap-2">
              {suggestions.map((s) => (
                <PressableScale
                  key={s}
                  onPress={() => addHabit(s)}
                  haptic
                  className="flex-row items-center gap-2 bg-surface rounded-xl px-3 py-2.5"
                >
                  <Plus size={16} color="#7C6FCD" />
                  <Text className="text-sm text-foreground flex-1">{s}</Text>
                </PressableScale>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
