"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

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

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

type DailyLog = {
  mood: number | null;
  energy: number | null;
  symptoms: string[];
};

export function MoodTracker() {
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/daily-log");
      if (res.ok) {
        const data: DailyLog | null = await res.json();
        if (data) {
          setMood(data.mood);
          setEnergy(data.energy);
          setSymptoms(data.symptoms);
          setSaved(true);
        }
      }
      setLoaded(true);
    }
    load();
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/daily-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood, energy, symptoms }),
    });
    if (res.ok) setSaved(true);
    setSaving(false);
  }

  function toggleSymptom(symptom: string) {
    setSaved(false);
    setSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom],
    );
  }

  if (!loaded) return null;

  const hasSelection = mood !== null || energy !== null || symptoms.length > 0;

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg flex items-center justify-between">
            Como você está hoje?
            {saved && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1 text-sm font-normal text-primary"
              >
                <Check size={14} />
                Salvo
              </motion.span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {/* Humor */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Humor</p>
            <div className="flex gap-2">
              {MOOD_OPTIONS.map((opt) => (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setMood(opt.value);
                    setSaved(false);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs md:text-sm font-medium border transition-colors duration-200 ${
                    mood === opt.value 
                    ? "bg-primary text-white border-primary" 
                    : "bg-primary/5 border-primary/10 text-muted-foreground hover:bg-primary/10 hover:border-primary/20"
                  }`}
                >
                  {opt.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Energia */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Energia</p>
            <div className="flex gap-2">
              {ENERGY_OPTIONS.map((opt) => (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setEnergy(opt.value);
                    setSaved(false);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs md:text-sm font-medium border transition-colors duration-200 ${
                    energy === opt.value 
                    ? "bg-primary text-white border-primary" 
                    : "bg-primary/5 border-primary/10 text-muted-foreground hover:bg-primary/10 hover:border-primary/20"
                  }`}
                >
                  {opt.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Sintomas */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">
              Sintomas{" "}
              <span className="text-muted-foreground font-normal">
                (Opcional)
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {SYMPTOM_OPTIONS.map((symptom) => (
                <motion.button
                  key={symptom}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => toggleSymptom(symptom)}
                  className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium border transition-colors duration-200 ${
                    symptoms.includes(symptom) 
                    ? "bg-primary text-white border-primary" 
                    : "bg-primary/5 border-primary/10 text-muted-foreground hover:bg-primary/10 hover:border-primary/20"
                  }`}
                >
                  {symptom}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Salvar */}
          <motion.div whileTap={{ scale: 0.97 }} className="flex md:justify-end">
            <Button
              onClick={save}
              disabled={saving || saved || !hasSelection}
              className="w-full md:w-auto hover:bg-accent"
            >
              {saved ? (
                <>
                  <Check size={16} className="mr-1" />
                  Registrado
                </>
              ) : (
                "Salvar registro"
              )}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
