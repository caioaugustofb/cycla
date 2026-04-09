"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, RefreshCw, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

type UserData = {
  name: string;
  email: string;
  cycleLength: number;
};

export default function SettingsPage() {
  const [data, setdata] = useState<UserData | null>(null);
  const [name, setName] = useState("");
  const [cycleLength, setCycleLength] = useState(28);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const user: UserData = await res.json();
        setdata(user);
        setName(user.name);
        setCycleLength(user.cycleLength);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, cycleLength }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 pt-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
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
        <h1 className="text-2xl md:text-3xl font-bold text-primary">Configurações</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Gerencie seu perfil e ciclo
        </p>
      </motion.div>

      {/* Perfil */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User size={15} className="text-primary" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={data?.email ?? ""}
                disabled
                className="opacity-60 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ciclo */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <RefreshCw size={15} className="text-primary" />
              Ciclo menstrual
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cycleLength">Duração média do ciclo (dias)</Label>
              <Input
                id="cycleLength"
                type="number"
                min={21}
                max={45}
                value={cycleLength}
                onChange={(e) => setCycleLength(Number(e.target.value))}
                className="w-28"
              />
              <p className="text-xs text-muted-foreground">
                Entre 21 e 45 dias. a média é 28 dias.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Salvar */}
      <motion.div variants={fadeUp}>
        <Button
          onClick={handleSave}
          disabled={saving || saved}
          className="w-full md:w-auto"
        >
          {saved ? (
            <>
              <Check size={15} className="mr-2" />
              Salvo!
            </>
          ) : saving ? (
            "Salvando..."
          ) : (
            "Salvar alterações"
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}