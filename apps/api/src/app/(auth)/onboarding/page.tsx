"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Sparkles } from "lucide-react";

const onboardingSchema = z.object({
  lastPeriodDate: z.string().min(1, "Informe a data"),
  cycleLength: z.number().min(21, "Mínimo 21 dias").max(35, "Máximo 35 dias"),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { cycleLength: 28 },
  });

  async function onSubmit(data: OnboardingForm) {
    setError("");

    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      setError("Erro ao salvar. Tente novamente.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <div className="bg-primary/10 p-3 rounded-2xl">
            <Sparkles size={28} className="text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl text-primary">Quase lá!</CardTitle>
        <CardDescription>Vamos configurar seu ciclo</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lastPeriodDate">Quando começou sua última menstruação?</Label>
            <Input id="lastPeriodDate" {...register("lastPeriodDate")} type="date" />
            {errors.lastPeriodDate && (
              <span className="text-xs text-destructive">{errors.lastPeriodDate.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cycleLength">Duração média do seu ciclo (dias)</Label>
            <Input
              id="cycleLength"
              {...register("cycleLength", { valueAsNumber: true })}
              type="number"
              min={21}
              max={35}
            />
            <span className="text-xs text-muted-foreground">
              A maioria dos ciclos dura entre 21 e 35 dias
            </span>
            {errors.cycleLength && (
              <span className="text-xs text-destructive">{errors.cycleLength.message}</span>
            )}
          </div>

          {error && <p className="text-xs text-destructive text-center">{error}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
            {isSubmitting ? "Salvando..." : "Começar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
