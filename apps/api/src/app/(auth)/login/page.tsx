"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";

const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type loginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<loginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: loginForm) {
    setError("");

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email ou senha inválidos");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary">Cycla</h1>
        <p className="text-medium mt-1">Entre na sua conta</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <p className="text-center text-sm text-medium">
        Não tem conta?{" "}
        <Link href="/registro" className="text-primary font-medium">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
