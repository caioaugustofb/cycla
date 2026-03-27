import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/db";
import { calculateCycleStatus } from "@/src/lib/cycle-engine";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { cycleLength: true },
  });

  const lastCycle = await prisma.cycle.findFirst({
    where: { userId: session.user.id },
    orderBy: { startDate: "desc" },
  });

  if (!user || !lastCycle) {
    return NextResponse.json({ error: "Dados do ciclo não encontrados" }, { status: 404 });
  }

  const status = calculateCycleStatus(lastCycle.startDate, user.cycleLength);

  return NextResponse.json(status);
}