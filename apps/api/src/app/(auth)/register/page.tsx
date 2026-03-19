"use client";

import { useState } from "react";
import { redirect, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { signIn } from "next-auth/react";

const registerSchema = z.object({
  name: z.string().min(2, "Mínimo de 2 caracteres"),
  email: z.email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterForm) {
    setError("");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "Erro ao criar sua conta");
      return;
    }

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError(
        "Conta criada, mas erro ao fazer login. Tente entrar manualmente.",
      );
      return;
    }

    router.push("/onboarding");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary">Cycla</h1>
        <p className="text-medium mt-1">Crie sua conta</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-dark">Nome</label>
          <input
            {...register("name")}
            type="text"
            placeholder="Seu nome"
            className="border border-border rounded-xl px-4 py-3 text-dark bg-white focus:outline-none focus:border-primary"
          />
          {errors.name && (
            <span className="text-xs text-red-500">{errors.name.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-dark">Email</label>
          <input
            {...register("email")}
            type="email"
            placeholder="seu@email.com"
            className="border border-border rounded-xl px-4 py-3 text-dark bg-white focus:outline-none focus:border-primary"
          />
          {errors.email && (
            <span className="text-xs text-red-500">{errors.email.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-dark">Senha</label>
          <input
            {...register("password")}
            type="password"
            placeholder="********"
            className="border border-border rounded-xl px-4 py-3 text-dark bg-white focus:outline-none focus:border-primary"
          />
          {errors.password && (
            <span className="text-xs text-red-500">
              {errors.password.message}
            </span>
          )}
        </div>

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>

      <p className="text-center text-sm text-medium">
        Já tem conta?{" "}
        <Link href="/registro" className="text-primary font-medium">
          Entrar
        </Link>
      </p>
    </div>
  );
}
