import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { getUser } from "@/src/lib/get-user";
import { calculateCycleStatus } from "@/src/lib/cycle-engine";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const cycle = await prisma.cycle.findFirst({
    where: { userId: user.id },
    orderBy: { startDate: "desc" },
  });

  if (!cycle) return NextResponse.json({ error: "Ciclo não encontrado" }, { status: 404 });

  const status = calculateCycleStatus(cycle.startDate, cycle.cycleLength);
  return NextResponse.json(status);
}