"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/src/components/ui/button";

const onboardingSchema = z.object({
  lastPeriodDate: z.string().min(1, "Informe a data"),
  cycleLength: z.number().min(21, "Mínimo 21 dias").max(35, "Máximo 35 dias"),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingForm>({
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
      setError("Erro ao salvar. Tente novamente");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary">Olá! 🌸</h1>
        <p className="text-medium mt-1">Vamos configurar seu ciclo</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-dark">
            Quando começou a sua última menstruação?
          </label>
          <input
            {...register("lastPeriodDate")}
            type="date"
            className="border border-border rounded-xl px-4 py-3 text-dark bg-white focus:outline-none focus:border-primary"
          />
          {errors.lastPeriodDate && (
            <span className="text-xs text-red-500">
              {errors.lastPeriodDate.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-dark">
            Duração média do seu ciclo (dias)
          </label>
          <input
            {...register("cycleLength", { valueAsNumber: true })}
            type="number"
            min={21}
            max={35}
            className="border border-border rounded-xl px-4 py-3 text-dark bg-white focus:outline-none focus:border-primary"
          />
          <span className="text-xs text-muted">
            A maioria dos ciclos dura entre 21 e 35 dias
          </span>
          {errors.cycleLength && (
            <span className="text-xs text-red-500">
              {errors.cycleLength.message}
            </span>
          )}
        </div>

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Começar"}
        </Button>
      </form>
    </div>
  );
}
