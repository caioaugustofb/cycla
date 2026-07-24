import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { z } from "zod/v4";
import { getUser } from "@/src/lib/get-user";

const dailyLogSchema = z.object({
  mood: z.number().min(1).max(5).optional(),
  energy: z.number().min(1).max(5).optional(),
  symptoms: z.array(z.string()).optional(),
});

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log = await prisma.dailyLog.findUnique({
    where: { userId_date: { userId: user.id, date: today() } },
  });

  return NextResponse.json(log);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = dailyLogSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { mood, energy, symptoms } = parsed.data;

  const log = await prisma.dailyLog.upsert({
    where: { userId_date: { userId: user.id, date: today() } },
    update: { mood: mood ?? null, energy: energy ?? null, symptoms: symptoms ?? [] },
    create: {
      userId: user.id,
      date: today(),
      mood: mood ?? null,
      energy: energy ?? null,
      symptoms: symptoms ?? [],
    },
  });

  return NextResponse.json(log);
}
