import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { getUser } from "@/src/lib/get-user";
import {
  calculateCycleStatus,
  cycleLengthStats,
  isHormonalContraceptive,
  DEFAULT_PERIOD_LENGTH,
  MIN_CYCLE_SAMPLES,
} from "@cycla/core";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [dbUser, cycles] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { cycleLength: true, periodLength: true, cycleRegularity: true, contraceptive: true },
    }),
    prisma.cycle.findMany({
      where: { userId: user.id },
      orderBy: { startDate: "desc" },
      select: { startDate: true, cycleLength: true },
    }),
  ]);

  const current = cycles[0];
  if (!current) return NextResponse.json({ error: "Ciclo não encontrado" }, { status: 404 });

  const estimated = dbUser?.cycleLength ?? current.cycleLength ?? 28;
  const stats = cycleLengthStats(cycles.map((c) => c.startDate));
  const cycleLength = stats.average ?? estimated;

  const periodLength = dbUser?.periodLength ?? DEFAULT_PERIOD_LENGTH;
  const status = calculateCycleStatus(current.startDate, cycleLength, new Date(), periodLength);
  return NextResponse.json({
    ...status,
    cycleLength,
    cycleStats: { ...stats, required: MIN_CYCLE_SAMPLES, estimated },
    cycleRegularity: dbUser?.cycleRegularity ?? null,
    usesHormonalContraceptive: isHormonalContraceptive(dbUser?.contraceptive),
  });
}