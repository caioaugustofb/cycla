import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import {
  CONTRACEPTIVES,
  CYCLE_REGULARITIES,
  REMINDER_PERIODS,
  MIN_PERIOD_LENGTH,
  MAX_PERIOD_LENGTH,
} from "@cycla/core";
import { prisma } from "@/src/lib/db";
import { getUser } from "@/src/lib/get-user";

const onboardingSchema = z.object({
  lastPeriodDate: z.string().min(1),
  cycleLength: z.number().int().min(21).max(45).optional(),
  periodLength: z.number().int().min(MIN_PERIOD_LENGTH).max(MAX_PERIOD_LENGTH).optional(),
  cycleRegularity: z.enum(CYCLE_REGULARITIES).optional(),
  contraceptive: z.enum(CONTRACEPTIVES).optional(),
  reminderPeriod: z.enum(REMINDER_PERIODS).optional(),
});

export async function POST(request: NextRequest) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();

  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { lastPeriodDate, cycleLength, ...profile } = parsed.data;

  await prisma.user.update({
    where: { id: user.id },
    data: { ...profile, ...(cycleLength && { cycleLength }) },
  });

  await prisma.cycle.create({
    data: {
      userId: user.id,
      startDate: new Date(lastPeriodDate),
      cycleLength: cycleLength ?? null,
    },
  });

  return NextResponse.json({ success: true });
}
