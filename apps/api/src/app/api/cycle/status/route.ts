import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { getUser } from "@/src/lib/get-user";
import { calculateCycleStatus, averageCycleLength } from "@cycla/core";

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

  const configured = dbUser?.cycleLength ?? current.cycleLength ?? 28;
  const cycleLength = averageCycleLength(
    cycles.map((c) => c.startDate),
    configured,
  );

  const status = calculateCycleStatus(current.startDate, cycleLength);
  return NextResponse.json({ ...status, cycleLength, configuredCycleLength: configured });
}