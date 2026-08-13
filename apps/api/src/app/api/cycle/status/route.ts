import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { getUser } from "@/src/lib/get-user";
import { calculateCycleStatus } from "@cycla/core";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [dbUser, cycle] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { cycleLength: true } }),
    prisma.cycle.findFirst({
      where: { userId: user.id },
      orderBy: { startDate: "desc" },
    }),
  ]);

  if (!cycle) return NextResponse.json({ error: "Ciclo não encontrado" }, { status: 404 });

  const cycleLength = cycle.cycleLength ?? dbUser?.cycleLength ?? 28;
  const status = calculateCycleStatus(cycle.startDate, cycleLength);
  return NextResponse.json(status);
}