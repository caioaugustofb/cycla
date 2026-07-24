import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { z } from "zod/v4";
import { getUser } from "@/src/lib/get-user";

const createTaskSchema = z.object({
  text: z.string().min(1, "Texto obrigatório"),
  category: z.enum(["exercise", "study", "rest", "social", "creative"]),
  duration: z.number().min(1),
  date: z.string().optional(),
  phaseWhenCreated: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      date: new Date(date),
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { text, category, duration, date, phaseWhenCreated } = parsed.data;

  const task = await prisma.task.create({
    data: {
      userId: user.id,
      text,
      category,
      duration,
      date: date ? new Date(date) : new Date(),
      phaseWhenCreated: phaseWhenCreated ?? null,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
