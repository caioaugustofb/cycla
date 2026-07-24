import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { CalendarDays, Plus, X, ChevronLeft, ChevronRight } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { apiFetch } from "@/lib/api";
import { PressableScale } from "@/components/PressableScale";

type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal";

type Cycle = {
  id: string;
  startDate: string;
  cycleLength: number;
};

const PHASE_COLORS: Record<CyclePhase, string> = {
  menstrual: "#FFC9D4",
  follicular: "#C7F0DB",
  ovulatory: "#FEF0B0",
  luteal: "#D4C5F9",
};

const PHASE_NAMES: Record<CyclePhase, string> = {
  menstrual: "Menstrual",
  follicular: "Folicular",
  ovulatory: "Ovulatória",
  luteal: "Lútea",
};

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function getPhaseForDate(
  date: Date,
  lastPeriodDate: Date,
  cycleLength: number
): CyclePhase | null {
  const msPerDay = 1000 * 60 * 60 * 24;
  const start = new Date(lastPeriodDate);
  start.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - start.getTime()) / msPerDay);
  if (diff < 0) return null;
  const dayOfCycle = (diff % cycleLength) + 1;
  if (dayOfCycle <= 5) return "menstrual";
  if (dayOfCycle <= 12) return "follicular";
  if (dayOfCycle <= 16) return "ovulatory";
  return "luteal";
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

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

function cycleDuration(current: Cycle, next: Cycle | undefined): string {
  if (!next) return "Em andamento";
  const start = new Date(current.startDate);
  const end = new Date(next.startDate);
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return `${days} dias`;
}

function getWeekStart(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function MonthlyCalendar({ year, month, cycles }: { year: number; month: number; cycles: Cycle[] }) {
  const latest = cycles[0];
  const lastPeriodDate = latest ? new Date(latest.startDate) : null;
  const cycleLength = latest?.cycleLength ?? 28;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();

  const days: (Date | null)[] = [
    ...Array(startPadding).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (days.length % 7 !== 0) days.push(null);

  return (
    <View>
      <View style={{ flexDirection: "row", marginBottom: 4 }}>
        {DAY_NAMES.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 11, color: "#9CA3AF", fontWeight: "500" }}>{d}</Text>
          </View>
        ))}
      </View>
      {Array.from({ length: days.length / 7 }, (_, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: "row", marginBottom: 4 }}>
          {days.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
            if (!day) return <View key={colIdx} style={{ flex: 1 }} />;
            const phase = lastPeriodDate ? getPhaseForDate(day, lastPeriodDate, cycleLength) : null;
            const today = isToday(day);
            return (
              <View key={colIdx} style={{ flex: 1, alignItems: "center", paddingVertical: 2 }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: phase ? PHASE_COLORS[phase] : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: today ? 2 : 0,
                    borderColor: "#7C6FCD",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: today ? "700" : "400",
                      color: today ? "#7C6FCD" : "#111827",
                    }}
                  >
                    {day.getDate()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function WeeklyCalendar({ weekStart, cycles }: { weekStart: Date; cycles: Cycle[] }) {
  const latest = cycles[0];
  const lastPeriodDate = latest ? new Date(latest.startDate) : null;
  const cycleLength = latest?.cycleLength ?? 28;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {days.map((day, i) => {
        const phase = lastPeriodDate ? getPhaseForDate(day, lastPeriodDate, cycleLength) : null;
        const today = isToday(day);
        return (
          <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
            <Text style={{ fontSize: 11, color: "#9CA3AF" }}>{DAY_NAMES[day.getDay()]}</Text>
            <View
              style={{
                width: "100%",
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: phase ? PHASE_COLORS[phase] : "#F5F0FF",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: today ? 2 : 0,
                borderColor: "#7C6FCD",
                gap: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: today ? "700" : "500",
                  color: today ? "#7C6FCD" : "#111827",
                }}
              >
                {day.getDate()}
              </Text>
              {phase && (
                <Text
                  style={{
                    fontSize: 8,
                    color: "#3D2B8A",
                    textAlign: "center",
                    paddingHorizontal: 2,
                  }}
                  numberOfLines={1}
                >
                  {PHASE_NAMES[phase]}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function TrackingScreen() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"monthly" | "weekly">("monthly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await apiFetch("/api/cycle");
    if (res.ok) setCycles(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  function navigatePrev() {
    if (view === "monthly") {
      setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    } else {
      const ws = getWeekStart(currentDate);
      const prev = new Date(ws);
      prev.setDate(ws.getDate() - 7);
      setCurrentDate(prev);
    }
  }

  function navigateNext() {
    if (view === "monthly") {
      setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    } else {
      const ws = getWeekStart(currentDate);
      const next = new Date(ws);
      next.setDate(ws.getDate() + 7);
      setCurrentDate(next);
    }
  }

  const weekStart = getWeekStart(currentDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  function headerLabel(): string {
    if (view === "monthly") {
      return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    const startStr = weekStart.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
    const endStr = weekEnd.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
    return `${startStr} – ${endStr}`;
  }

  const avgCycleLength =
    cycles.length > 1
      ? Math.round(
          cycles.slice(0, -1).reduce((sum, cycle, i) => {
            const next = cycles[i + 1];
            const days = Math.round(
              (new Date(cycle.startDate).getTime() - new Date(next.startDate).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return sum + days;
          }, 0) /
            (cycles.length - 1)
        )
      : null;

  async function handleRegister() {
    setError("");
    const parsed = parseDate(date);
    if (!parsed) {
      setError("Informe a data no formato DD/MM/AAAA");
      return;
    }
    const entered = new Date(parsed);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (entered > today) {
      setError("A data não pode ser no futuro");
      return;
    }
    setSaving(true);
    const res = await apiFetch("/api/cycle", {
      method: "POST",
      body: JSON.stringify({ startDate: parsed }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Erro ao salvar. Tente novamente.");
      return;
    }
    setDate("");
    setShowForm(false);
    load();
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
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, gap: 16 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-muted text-sm">Acompanhamento</Text>
            <Text className="text-2xl font-bold text-foreground">Meu ciclo</Text>
          </View>
          <PressableScale
            className="bg-primary rounded-2xl px-4 py-2.5 flex-row items-center gap-2"
            onPress={() => {
              setShowForm((v) => !v);
              setError("");
              setDate("");
            }}
            haptic
          >
            {showForm ? <X size={16} color="#fff" /> : <Plus size={16} color="#fff" />}
            <Text className="text-on-primary font-semibold text-sm">
              {showForm ? "Cancelar" : "Registrar"}
            </Text>
          </PressableScale>
        </View>

        {/* Registration form */}
        {showForm && (
          <View className="bg-surface-card rounded-2xl p-5 border border-border gap-4">
            <Text className="text-base font-semibold text-foreground">
              Quando sua menstruação começou?
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl text-foreground"
              style={{ height: 48, paddingHorizontal: 16, fontSize: 14 }}
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#9CA3AF"
              value={date}
              onChangeText={(t) => setDate(formatDateInput(t))}
              keyboardType="numeric"
              maxLength={10}
            />
            {error ? <Text className="text-xs text-danger">{error}</Text> : null}
            <PressableScale
              className="bg-primary rounded-2xl py-3.5 items-center"
              onPress={handleRegister}
              disabled={saving}
              haptic
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-on-primary font-semibold text-base">Salvar</Text>
              )}
            </PressableScale>
          </View>
        )}

        {/* Calendar card */}
        <View className="bg-surface-card rounded-2xl p-5 border border-border gap-4">
          {/* View toggle */}
          <View className="flex-row bg-surface rounded-xl p-1 gap-1">
            {(["monthly", "weekly"] as const).map((v) => (
              <PressableScale
                key={v}
                style={{ flex: 1 }}
                className={`rounded-lg py-2 items-center ${view === v ? "bg-primary" : ""}`}
                onPress={() => setView(v)}
              >
                <Text
                  className="text-sm font-medium"
                  style={{ color: view === v ? "#fff" : "#9CA3AF" }}
                >
                  {v === "monthly" ? "Mensal" : "Semanal"}
                </Text>
              </PressableScale>
            ))}
          </View>

          {/* Navigation */}
          <View className="flex-row items-center justify-between">
            <PressableScale onPress={navigatePrev} className="p-1">
              <ChevronLeft size={20} color="#7C6FCD" />
            </PressableScale>
            <Text className="text-sm font-semibold text-foreground">{headerLabel()}</Text>
            <PressableScale onPress={navigateNext} className="p-1">
              <ChevronRight size={20} color="#7C6FCD" />
            </PressableScale>
          </View>

          {/* Grid */}
          {cycles.length === 0 ? (
            <View className="items-center py-6">
              <Text className="text-sm text-muted text-center">
                Registre sua menstruação para ver as fases no calendário.
              </Text>
            </View>
          ) : view === "monthly" ? (
            <MonthlyCalendar
              year={currentDate.getFullYear()}
              month={currentDate.getMonth()}
              cycles={cycles}
            />
          ) : (
            <WeeklyCalendar weekStart={weekStart} cycles={cycles} />
          )}

          {/* Legend */}
          {cycles.length > 0 && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: "rgba(124,111,205,0.15)",
              }}
            >
              {(Object.entries(PHASE_NAMES) as [CyclePhase, string][]).map(([phase, name]) => (
                <View key={phase} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: PHASE_COLORS[phase],
                      borderWidth: 1,
                      borderColor: "rgba(124,111,205,0.3)",
                    }}
                  />
                  <Text style={{ fontSize: 11, color: "#9CA3AF" }}>{name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Stats */}
        {avgCycleLength && (
          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface-card rounded-2xl p-4 border border-border items-center">
              <Text className="text-2xl font-bold text-primary">{avgCycleLength}</Text>
              <Text className="text-xs text-muted mt-1">Dias em média</Text>
            </View>
            <View className="flex-1 bg-surface-card rounded-2xl p-4 border border-border items-center">
              <Text className="text-2xl font-bold text-primary">{cycles.length}</Text>
              <Text className="text-xs text-muted mt-1">Ciclos registrados</Text>
            </View>
          </View>
        )}

        {/* History */}
        {cycles.length === 0 ? (
          <View className="items-center py-12 gap-3">
            <CalendarDays size={40} color="#A78BFA" />
            <Text className="text-base font-semibold text-foreground">Nenhum ciclo registrado</Text>
            <Text className="text-sm text-muted text-center">
              Registre o início da sua menstruação para começar o histórico.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Histórico</Text>
            {cycles.map((cycle, i) => (
              <Animated.View
                key={`${animKey}-${cycle.id}`}
                entering={FadeInDown.delay(Math.min(i, 6) * 50).duration(250)}
                className="bg-surface-card rounded-2xl px-4 py-4 border border-border flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3">
                  <View className="bg-accent-light p-2 rounded-xl">
                    <CalendarDays size={18} color="#7C6FCD" />
                  </View>
                  <View>
                    <Text className="text-sm font-semibold text-foreground">
                      {formatDate(cycle.startDate)}
                    </Text>
                    <Text className="text-xs text-muted mt-0.5">Início da menstruação</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-sm font-semibold text-primary">
                    {cycleDuration(cycle, cycles[i + 1])}
                  </Text>
                  {i === 0 && (
                    <Text className="text-xs text-muted mt-0.5">Ciclo atual</Text>
                  )}
                </View>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
