import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { z } from "zod/v4";
import { getUser } from "@/src/lib/get-user";

const PHASES = ["menstrual", "follicular", "ovulatory", "luteal"] as const;

const createHabitSchema = z.object({
  phase: z.enum(PHASES),
  text: z.string().min(1, "Texto obrigatório"),
});

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const phase = searchParams.get("phase");

  const habits = await prisma.habit.findMany({
    where: { userId: user.id, ...(phase ? { phase } : {}) },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(habits);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createHabitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const habit = await prisma.habit.create({
    data: { userId: user.id, phase: parsed.data.phase, text: parsed.data.text },
  });

  return NextResponse.json(habit, { status: 201 });
}