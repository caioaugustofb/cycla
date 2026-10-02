import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { getUser } from "@/src/lib/get-user";
import { calculateCycleStatus, cycleLengthStats, MIN_CYCLE_SAMPLES } from "@cycla/core";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [dbUser, cycles] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { cycleLength: true } }),
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

  const status = calculateCycleStatus(current.startDate, cycleLength);
  return NextResponse.json({
    ...status,
    cycleLength,
    cycleStats: { ...stats, required: MIN_CYCLE_SAMPLES, estimated },
  });
}