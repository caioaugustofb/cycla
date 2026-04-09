"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Smile, Zap, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { MoodEnergyChart } from "@/src/components/MoodEnergyChart";

type RawLog = {
  date: string;
  mood: number | null;
  energy: number | null;
  symptoms: string[];
};

type ChartPoint = {
  date: string;
  mood: number | null;
  energy: number | null;
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

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function buildChartData(logs: RawLog[]): ChartPoint[] {
  const map = new Map(
    logs.map((l) => [
      new Date(l.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      l,
    ])
  );

  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const log = map.get(label);
    return { date: label, mood: log?.mood ?? null, energy: log?.energy ?? null };
  });
}

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

export default function ProgressPage() {
  const [logs, setLogs] = useState<RawLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/progress");
      if (res.ok) setLogs(await res.json());
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 pt-8">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const chartData = buildChartData(logs);
  const avgMood = average(logs.map((l) => l.mood));
  const avgEnergy = average(logs.map((l) => l.energy));
  const symptoms = topSymptoms(logs);
  const hasData = logs.length > 0;

  return (
    <motion.div
      className="flex flex-col gap-6 pt-8 pb-8"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl md:text-3xl font-bold text-primary">Progresso</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">Últimos 30 dias</p>
      </motion.div>

      {/* Cards de resumo */}
      <motion.div className="grid grid-cols-3 gap-3" variants={staggerContainer}>
        {/* Humor */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardContent className="flex flex-col gap-1 pt-4 pb-4">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Smile size={14} />
                <span className="text-xs">Humor médio</span>
              </div>
              {avgMood !== null ? (
                <>
                  <p className="text-2xl font-bold text-primary">{avgMood}</p>
                  <p className="text-xs text-muted-foreground">
                    {MOOD_LABELS[Math.round(avgMood)]}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">-</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Energia */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardContent className="flex flex-col gap-1 pt-4 pb-4">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Zap size={14} />
                <span className="text-xs">Energia média</span>
              </div>
              {avgEnergy !== null ? (
                <>
                  <p className="text-2xl font-bold text-primary">{avgEnergy}</p>
                  <p className="text-xs text-muted-foreground">
                    {ENERGY_LABELS[Math.round(avgEnergy)]}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">-</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top sintomas */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardContent className="flex flex-col gap-1 pt-4 pb-4">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Activity size={14} />
                <span className="text-xs">Top sintomas</span>
              </div>
              {symptoms.length > 0 ? (
                <ul className="flex flex-col gap-0.5 mt-1">
                  {symptoms.map((s) => (
                    <li key={s.name} className="text-xs text-foreground truncate">
                      {s.name} <span className="text-muted-foreground">({s.count}x)</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">-</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Gráfico */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Humor e Energia</CardTitle>
          </CardHeader>
          <CardContent>
            {hasData ? (
              <MoodEnergyChart data={chartData} />
            ) : (
              <p className="text-sm text-muted-foreground py-12 text-center">
                Nenhum registro ainda. Comece a registrar no dashboard!
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
