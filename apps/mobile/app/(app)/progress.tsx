import { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Smile, Zap, Activity } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { apiFetch } from "@/lib/api";

type RawLog = {
  date: string;
  mood: number | null;
  energy: number | null;
  symptoms: string[];
};

const MOOD_LABELS: Record<number, string> = {
  1: "Péssimo",
  2: "Ruim",
  3: "Ok",
  4: "Bem",
  5: "Ótimo",
};

const ENERGY_LABELS: Record<number, string> = {
  1: "Esgotada",
  2: "Cansada",
  3: "Estável",
  4: "Disposta",
  5: "Ativa",
};

function average(values: (number | null)[]) {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}

function topSymptoms(logs: RawLog[]) {
  const counts: Record<string, number> = {};
  for (const log of logs) {
    for (const s of log.symptoms) {
      counts[s] = (counts[s] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));
}

function MiniBar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = (value / max) * 100;
  return (
    <View className="h-2 bg-surface rounded-full overflow-hidden mt-1">
      <View
        className="h-full rounded-full"
        style={{ width: `${pct}%`, backgroundColor: "#7C6FCD" }}
      />
    </View>
  );
}

export default function ProgressScreen() {
  const [logs, setLogs] = useState<RawLog[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    async function load() {
      const res = await apiFetch("/api/progress");
      if (res.ok) setLogs(await res.json());
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color="#7C6FCD" size="large" />
      </SafeAreaView>
    );
  }

  const avgMood = average(logs.map((l) => l.mood));
  const avgEnergy = average(logs.map((l) => l.energy));
  const symptoms = topSymptoms(logs);
  const hasData = logs.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, gap: 20 }}>
        <View>
          <Text className="text-2xl font-bold text-primary">Progresso</Text>
          <Text className="text-sm text-muted mt-1">Últimos 30 dias</Text>
        </View>

        <Animated.View
          key={`stats-${animKey}`}
          entering={FadeInDown.duration(250)}
          className="flex-row gap-3"
        >
          <View className="flex-1 bg-white rounded-2xl p-4 border border-border gap-1">
            <View className="flex-row items-center gap-1.5">
              <Smile size={14} color="#9ca3af" />
              <Text className="text-xs text-muted">Humor médio</Text>
            </View>
            {avgMood !== null ? (
              <>
                <Text className="text-2xl font-bold text-primary">{avgMood}</Text>
                <Text className="text-xs text-muted">{MOOD_LABELS[Math.round(avgMood)]}</Text>
                <MiniBar value={avgMood} />
              </>
            ) : (
              <Text className="text-sm text-muted mt-1">-</Text>
            )}
          </View>

          <View className="flex-1 bg-white rounded-2xl p-4 border border-border gap-1">
            <View className="flex-row items-center gap-1.5">
              <Zap size={14} color="#9ca3af" />
              <Text className="text-xs text-muted">Energia média</Text>
            </View>
            {avgEnergy !== null ? (
              <>
                <Text className="text-2xl font-bold text-primary">{avgEnergy}</Text>
                <Text className="text-xs text-muted">
                  {ENERGY_LABELS[Math.round(avgEnergy)]}
                </Text>
                <MiniBar value={avgEnergy} />
              </>
            ) : (
              <Text className="text-sm text-muted mt-1">-</Text>
            )}
          </View>
        </Animated.View>

        <Animated.View
          key={`symptoms-${animKey}`}
          entering={FadeInDown.delay(50).duration(250)}
          className="bg-white rounded-2xl p-4 border border-border gap-3"
        >
          <View className="flex-row items-center gap-1.5">
            <Activity size={14} color="#9ca3af" />
            <Text className="text-sm font-semibold text-foreground">Top sintomas</Text>
          </View>
          {symptoms.length > 0 ? (
            <View className="gap-2">
              {symptoms.map((s) => (
                <View key={s.name} className="flex-row items-center justify-between">
                  <Text className="text-sm text-foreground">{s.name}</Text>
                  <View className="bg-accent-light px-2 py-0.5 rounded-full">
                    <Text className="text-xs text-primary font-medium">{s.count}x</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-muted">Nenhum sintoma registrado.</Text>
          )}
        </Animated.View>

        {hasData && (
          <Animated.View
            key={`records-${animKey}`}
            entering={FadeInDown.delay(100).duration(250)}
            className="bg-white rounded-2xl p-4 border border-border gap-3"
          >
            <Text className="text-sm font-semibold text-foreground">Registros recentes</Text>
            <View className="gap-2">
              {logs.slice(-7).reverse().map((log) => (
                <View
                  key={log.date}
                  className="flex-row items-center justify-between py-2 border-b border-border"
                >
                  <Text className="text-xs text-muted w-16">
                    {new Date(log.date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </Text>
                  <View className="flex-row gap-4 flex-1 justify-end">
                    <View className="flex-row items-center gap-1">
                      <Smile size={12} color="#9ca3af" />
                      <Text className="text-xs text-foreground">
                        {log.mood ?? "-"}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Zap size={12} color="#9ca3af" />
                      <Text className="text-xs text-foreground">
                        {log.energy ?? "-"}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {!hasData && (
          <View className="bg-white rounded-2xl p-6 border border-border items-center">
            <Text className="text-sm text-muted text-center">
              Nenhum registro ainda. Comece a registrar no dashboard!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
