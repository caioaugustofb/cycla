import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { z } from "zod/v4";
import {
  CONTRACEPTIVES,
  CYCLE_REGULARITIES,
  REMINDER_PERIODS,
  MIN_PERIOD_LENGTH,
  MAX_PERIOD_LENGTH,
} from "@cycla/core";
import { getUser } from "@/src/lib/get-user";

const userSelect = {
  name: true,
  email: true,
  periodLength: true,
  cycleRegularity: true,
  contraceptive: true,
  reminderPeriod: true,
} as const;

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: userSelect,
  });

  return NextResponse.json(userData);
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  periodLength: z.number().int().min(MIN_PERIOD_LENGTH).max(MAX_PERIOD_LENGTH).nullable().optional(),
  cycleRegularity: z.enum(CYCLE_REGULARITIES).nullable().optional(),
  contraceptive: z.enum(CONTRACEPTIVES).nullable().optional(),
  reminderPeriod: z.enum(REMINDER_PERIODS).nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const userData = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
    select: userSelect,
  });

  return NextResponse.json(userData);
}
