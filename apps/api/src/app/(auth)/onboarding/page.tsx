"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Sparkles, AlertTriangle } from "lucide-react";

const onboardingSchema = z.object({
  lastPeriodDate: z.string().min(1, "Informe a data"),
  cycleLength: z.number().min(21, "Mínimo 21 dias").max(45, "Máximo 45 dias"),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { cycleLength: 28 },
  });

  const cycleLength = watch("cycleLength");

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
            <Label htmlFor="cycleLength">Duração do seu ciclo menstrual (dias)</Label>
            <Input
              id="cycleLength"
              {...register("cycleLength", { valueAsNumber: true })}
              type="number"
              min={21}
              max={45}
            />
            <span className="text-xs text-muted-foreground">
              Contado do primeiro dia da menstruação até o início da próxima. A média é 28 dias.
            </span>
            {errors.cycleLength && (
              <span className="text-xs text-destructive">{errors.cycleLength.message}</span>
            )}
            {cycleLength > 35 && !errors.cycleLength && (
              <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
                <p>
                  Ciclos acima de 35 dias podem indicar <strong>oligomenorreia</strong> — uma
                  irregularidade que pode estar associada a condições como SOP, hipotireoidismo ou
                  alterações hormonais. Considere consultar um ginecologista para avaliação.
                </p>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-destructive text-center">{error}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
            {isSubmitting ? "Salvando..." : "Começar"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
