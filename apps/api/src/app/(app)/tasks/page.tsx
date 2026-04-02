"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Zap, CheckSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  TASK_SUGGESTIONS,
  TaskSuggestion,
  TaskCategory,
} from "@/src/lib/task-suggestions";

type Task = {
  id: string;
  text: string;
  category: string;
  duration: number;
  completed: boolean;
  phaseWhenCreated: string | null;
};

type CycleStatus = {
  phase: string;
  phaseInfo: { label: string };
};

const CATEGORY_LABELS: Record<string, string> = {
  exercise: "Exercício",
  study: "Estudo",
  rest: "Descanso",
  social: "Social",
  creative: "Criativo",
};

const CATEGORY_OPTIONS: { value: TaskCategory; label: string }[] = [
  { value: "exercise", label: "Exercício" },
  { value: "study", label: "Estudo" },
  { value: "rest", label: "Descanso" },
  { value: "social", label: "Social" },
  { value: "creative", label: "Criativo" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    x: -16,
    scale: 0.97,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cycleStatus, setCycleStatus] = useState<CycleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [customText, setCustomText] = useState("");
  const [customCategory, setCustomCategory] = useState<TaskCategory>("study");
  const [customDuration, setCustomDuration] = useState(30);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function load() {
      const [tasksRes, cycleRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/cycle/status"),
      ]);
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (cycleRes.ok) setCycleStatus(await cycleRes.json());
      setLoading(false);
    }
    load();
  }, []);

  async function addTask(suggestion: TaskSuggestion) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: suggestion.text,
        category: suggestion.category,
        duration: suggestion.duration,
        phaseWhenCreated: cycleStatus?.phase ?? null,
      }),
    });
    if (res.ok) {
      const task = await res.json();
      setTasks((prev) => [...prev, task]);
    }
  }

  async function addCustomTask() {
    if (!customText.trim()) return;
    setAdding(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: customText.trim(),
        category: customCategory,
        duration: customDuration,
        phaseWhenCreated: cycleStatus?.phase ?? null,
      }),
    });
    if (res.ok) {
      const task = await res.json();
      setTasks((prev) => [...prev, task]);
      setCustomText("");
      setCustomCategory("study");
      setCustomDuration(30);
    }
    setAdding(false);
  }

  async function toggleTask(id: string, completed: boolean) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed }),
    });
    if (res.ok) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t)),
      );
    }
  }

  async function deleteTask(id: string) {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  }

  const suggestions = cycleStatus
    ? (TASK_SUGGESTIONS[cycleStatus.phase] ?? [])
    : [];
  const addedTexts = new Set(tasks.map((t) => t.text));
  const availableSuggestions = suggestions.filter(
    (s) => !addedTexts.has(s.text),
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6 pt-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col gap-6 pt-8 pb-8"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl md:text-3xl font-bold text-primary">
          Tarefas do dia
        </h1>
        {cycleStatus && (
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Fase atual:{" "}
            <span className="font-medium">{cycleStatus.phaseInfo.label}</span>
          </p>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Coluna esquerda — Sugestões da fase */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader className="pb-3 md:pb-5 md:pt-6 md:px-6">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Zap size={18} className="text-primary" />
                Sugestões para hoje
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 md:gap-3 md:px-6 md:pb-6">
              <AnimatePresence initial={false}>
                {availableSuggestions.length === 0 ? (
                  <motion.p
                    key="empty-suggestions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm md:text-base text-muted-foreground text-center py-6"
                  >
                    Todas as sugestões já foram adicionadas.
                  </motion.p>
                ) : (
                  availableSuggestions.map((suggestion) => (
                    <motion.div
                      key={suggestion.text}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className="flex items-center justify-between gap-3 p-3 md:p-4 rounded-xl bg-primary/5
  border border-primary/10 hover:bg-primary/10 hover:border-primary/20 transition-colors duration-200"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm md:text-base font-medium">
                          {suggestion.text}
                        </span>
                        <span className="text-xs md:text-sm text-muted-foreground mt-0.5">
                          {CATEGORY_LABELS[suggestion.category]} ·{" "}
                          {suggestion.duration} min
                        </span>
                      </div>
                      <motion.div
                        whileTap={{ scale: 0.85 }}
                        whileHover={{ scale: 1.1 }}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0"
                          onClick={() => addTask(suggestion)}
                        >
                          <Plus size={16} />
                        </Button>
                      </motion.div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Coluna direita — Minhas tarefas + Formulário */}
        <div className="flex flex-col gap-4">
          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader className="pb-3 md:pb-5 md:pt-6 md:px-6">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <CheckSquare size={18} className="text-primary" />
                  Minhas tarefas
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 md:gap-3 md:px-6 md:pb-6">
                <AnimatePresence initial={false}>
                  {tasks.length === 0 ? (
                    <motion.p
                      key="empty-tasks"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm md:text-base text-muted-foreground text-center py-6"
                    >
                      Nenhuma tarefa adicionada ainda.
                    </motion.p>
                  ) : (
                    tasks.map((task) => (
                      <motion.div
                        key={task.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className="flex items-center gap-3 p-3 md:p-4 rounded-xl border border-border
  hover:border-primary/30 hover:bg-primary/5 transition-colors duration-200"
                      >
                        <motion.button
                          whileTap={{ scale: 0.75 }}
                          onClick={() => toggleTask(task.id, task.completed)}
                          className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 shrink-0 transition-all
  duration-200 ${
    task.completed
      ? "bg-primary border-primary"
      : "border-muted-foreground hover:border-primary"
  }`}
                        />
                        <div className="flex flex-col flex-1 min-w-0">
                          <span
                            className={`text-sm md:text-base font-medium transition-colors duration-200 ${
                              task.completed
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {task.text}
                          </span>
                          <span className="text-xs md:text-sm text-muted-foreground mt-0.5">
                            {CATEGORY_LABELS[task.category] ?? task.category} ·{" "}
                            {task.duration} min
                          </span>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          whileHover={{ scale: 1.15 }}
                          onClick={() => deleteTask(task.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors
  duration-150 shrink-0"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader className="pb-3 md:pb-5 md:pt-6 md:px-6">
                <CardTitle className="text-base md:text-lg">
                  Adicionar tarefa
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 md:px-6 md:pb-6">
                <Input
                  placeholder="Nome da tarefa"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomTask()}
                  className="md:text-base"
                />
                <div className="flex gap-2">
                  <Select
                    value={customCategory}
                    onValueChange={(v) => setCustomCategory(v as TaskCategory)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div
                    className="flex items-center gap-1.5 border border-border rounded-xl px-3 py-2
  transition-colors duration-150 focus-within:border-primary/50 focus-within:ring-2
  focus-within:ring-primary/20"
                  >
                    <input
                      type="number"
                      min={5}
                      max={240}
                      value={customDuration}
                      onChange={(e) =>
                        setCustomDuration(Number(e.target.value))
                      }
                      className="w-12 bg-transparent text-sm md:text-base text-foreground focus:outline-none"
                    />
                    <span className="text-xs md:text-sm text-muted-foreground">
                      min
                    </span>
                  </div>
                </div>
                <div className="flex md:justify-end">
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    className="w-full md:w-auto"
                  >
                    <Button
                      onClick={addCustomTask}
                      disabled={adding || !customText.trim()}
                      className="w-full md:w-auto hover:bg-accent"
                    >
                      <Plus size={16} className="mr-1" />
                      Adicionar
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
