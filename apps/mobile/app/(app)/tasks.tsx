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
import { Plus, Trash2, Zap, CheckSquare, Check } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { apiFetch } from "@/lib/api";
import { TASK_SUGGESTIONS, TaskCategory } from "@/lib/task-suggestions";
import { PressableScale } from "@/components/PressableScale";

type Task = {
  id: string;
  text: string;
  category: string;
  duration: number;
  completed: boolean;
  phaseWhenCreated: string | null;
};

type CycleStatus = { phase: string; phaseInfo: { label: string; name: string } };

const CATEGORY_LABELS: Record<string, string> = {
  exercise: "Exercício",
  study: "Estudo",
  rest: "Descanso",
  social: "Social",
  creative: "Criativo",
};

const CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: "exercise", label: "Exercício" },
  { value: "study", label: "Estudo" },
  { value: "rest", label: "Descanso" },
  { value: "social", label: "Social" },
  { value: "creative", label: "Criativo" },
];

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cycleStatus, setCycleStatus] = useState<CycleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [customText, setCustomText] = useState("");
  const [customCategory, setCustomCategory] = useState<TaskCategory>("study");
  const [customDuration, setCustomDuration] = useState("30");
  const [adding, setAdding] = useState(false);

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
      const [tasksRes, cycleRes] = await Promise.all([
        apiFetch("/api/tasks"),
        apiFetch("/api/cycle/status"),
      ]);
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (cycleRes.ok) setCycleStatus(await cycleRes.json());
      setLoading(false);
    }
    load();
  }, []);

  async function addSuggestion(text: string, category: TaskCategory, duration: number) {
    const res = await apiFetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ text, category, duration, phaseWhenCreated: cycleStatus?.phase }),
    });
    if (res.ok) {
      const task = await res.json();
      setTasks((prev) => [...prev, task]);
    }
  }

  async function addCustomTask() {
    if (!customText.trim()) return;
    setAdding(true);
    const res = await apiFetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        text: customText.trim(),
        category: customCategory,
        duration: parseInt(customDuration, 10) || 30,
        phaseWhenCreated: cycleStatus?.phase,
      }),
    });
    if (res.ok) {
      const task = await res.json();
      setTasks((prev) => [...prev, task]);
      setCustomText("");
      setCustomDuration("30");
    }
    setAdding(false);
  }

  async function toggleTask(id: string, completed: boolean) {
    const res = await apiFetch(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: !completed }),
    });
    if (res.ok) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t)));
    }
  }

  async function deleteTask(id: string) {
    const res = await apiFetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (res.ok) setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  const suggestions = cycleStatus ? (TASK_SUGGESTIONS[cycleStatus.phase] ?? []) : [];
  const addedTexts = new Set(tasks.map((t) => t.text));
  const availableSuggestions = suggestions.filter((s) => !addedTexts.has(s.text));

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
          <Text className="text-2xl font-bold text-primary">Tarefas do dia</Text>
          {cycleStatus && (
            <Text className="text-sm text-muted mt-1">
              Fase atual:{" "}
              <Text className="font-medium text-foreground">{cycleStatus.phaseInfo.name}</Text>
            </Text>
          )}
        </View>

        <Animated.View
          key={`sugg-${animKey}`}
          entering={FadeInDown.duration(250)}
          className="bg-white rounded-2xl p-4 border border-border gap-3"
        >
          <View className="flex-row items-center gap-2">
            <Zap size={16} color="#7C6FCD" />
            <Text className="text-base font-semibold text-foreground">Sugestões para hoje</Text>
          </View>
          {availableSuggestions.length === 0 ? (
            <Text className="text-sm text-muted text-center py-4">
              Todas as sugestões já foram adicionadas.
            </Text>
          ) : (
            availableSuggestions.map((s) => (
              <View
                key={s.text}
                className="flex-row items-center justify-between p-3 rounded-xl border border-border"
                style={{ backgroundColor: "#F5F0FF" }}
              >
                <View className="flex-1 mr-3">
                  <Text className="text-sm font-medium text-foreground">{s.text}</Text>
                  <Text className="text-xs text-muted mt-0.5">
                    {CATEGORY_LABELS[s.category]} · {s.duration} min
                  </Text>
                </View>
                <PressableScale
                  onPress={() => addSuggestion(s.text, s.category, s.duration)}
                  className="bg-primary rounded-xl p-2"
                  haptic
                >
                  <Plus size={16} color="#fff" />
                </PressableScale>
              </View>
            ))
          )}
        </Animated.View>

        <Animated.View
          key={`tasks-${animKey}`}
          entering={FadeInDown.delay(50).duration(250)}
          className="bg-white rounded-2xl p-4 border border-border gap-3"
        >
          <View className="flex-row items-center gap-2">
            <CheckSquare size={16} color="#7C6FCD" />
            <Text className="text-base font-semibold text-foreground">Minhas tarefas</Text>
          </View>
          {tasks.length === 0 ? (
            <Text className="text-sm text-muted text-center py-4">
              Nenhuma tarefa adicionada ainda.
            </Text>
          ) : (
            tasks.map((task) => (
              <View
                key={task.id}
                className="flex-row items-center gap-3 p-3 rounded-xl border border-border"
              >
                <PressableScale
                  onPress={() => toggleTask(task.id, task.completed)}
                  className="w-5 h-5 rounded-full border-2 shrink-0 items-center justify-center"
                  style={{
                    backgroundColor: task.completed ? "#7C6FCD" : "transparent",
                    borderColor: task.completed ? "#7C6FCD" : "#9ca3af",
                  }}
                >
                  {task.completed && <Check size={10} color="#fff" strokeWidth={3} />}
                </PressableScale>
                <View className="flex-1 min-w-0">
                  <Text
                    className="text-sm font-medium"
                    style={{
                      color: task.completed ? "#9ca3af" : "#111827",
                      textDecorationLine: task.completed ? "line-through" : "none",
                    }}
                  >
                    {task.text}
                  </Text>
                  <Text className="text-xs text-muted mt-0.5">
                    {CATEGORY_LABELS[task.category] ?? task.category} · {task.duration} min
                  </Text>
                </View>
                <PressableScale onPress={() => deleteTask(task.id)}>
                  <Trash2 size={16} color="#9ca3af" />
                </PressableScale>
              </View>
            ))
          )}
        </Animated.View>

        <Animated.View
          key={`add-${animKey}`}
          entering={FadeInDown.delay(100).duration(250)}
          className="bg-white rounded-2xl p-4 border border-border gap-3"
        >
          <Text className="text-base font-semibold text-foreground">Adicionar tarefa</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl text-foreground"
            style={{ height: 48, paddingHorizontal: 16, fontSize: 14 }}
            placeholder="Nome da tarefa"
            placeholderTextColor="#9ca3af"
            value={customText}
            onChangeText={setCustomText}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {CATEGORIES.map((cat) => (
                <PressableScale
                  key={cat.value}
                  onPress={() => setCustomCategory(cat.value)}
                  className="px-3 py-2 rounded-xl border"
                  style={{
                    backgroundColor: customCategory === cat.value ? "#7C6FCD" : "#F5F0FF",
                    borderColor:
                      customCategory === cat.value ? "#7C6FCD" : "rgba(124,111,205,0.15)",
                  }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: customCategory === cat.value ? "#fff" : "#9ca3af" }}
                  >
                    {cat.label}
                  </Text>
                </PressableScale>
              ))}
            </View>
          </ScrollView>
          <View className="flex-row items-center gap-2">
            <TextInput
              className="bg-surface border border-border rounded-xl text-foreground w-20"
              style={{ height: 48, paddingHorizontal: 12, fontSize: 14 }}
              placeholder="30"
              placeholderTextColor="#9ca3af"
              value={customDuration}
              onChangeText={setCustomDuration}
              keyboardType="number-pad"
            />
            <Text className="text-sm text-muted">minutos</Text>
          </View>
          <PressableScale
            onPress={addCustomTask}
            disabled={adding || !customText.trim()}
            haptic
            className="bg-primary rounded-2xl py-3.5 items-center flex-row justify-center gap-2"
            style={{ opacity: adding || !customText.trim() ? 0.5 : 1 }}
          >
            <Plus size={16} color="#fff" />
            <Text className="text-white font-semibold text-sm">Adicionar</Text>
          </PressableScale>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

