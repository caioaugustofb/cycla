import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod/v4";
import { prisma } from "@/src/lib/db";
import { getUser } from "@/src/lib/get-user";

const registerSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  return NextResponse.json(
    { id: user.id, name: user.name, email: user.email },
    { status: 201 },
  );
}

const UNDO_WINDOW_MS = 24 * 60 * 60 * 1000;

// Desfaz um cadastro que não concluiu o onboarding (seta de voltar no primeiro passo).
export async function DELETE() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { createdAt: true, _count: { select: { cycles: true } } },
  });

  const isUnfinished =
    dbUser &&
    dbUser._count.cycles === 0 &&
    Date.now() - dbUser.createdAt.getTime() < UNDO_WINDOW_MS;

    if (!isUnfinished) {
      return NextResponse.json({ error: "Cadastro não pode ser desfeito" }, { status: 409 });
    }

    await prisma.user.delete({ where: { id: user.id } });
    return NextResponse.json({ success: true });
}