import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { getUser } from "@/src/lib/get-user";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const cycles = await prisma.cycle.findMany({
    where: { userId: user.id },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json(cycles);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { startDate } = await req.json();
  if (!startDate) return NextResponse.json({ error: "Data obrigatória" }, { status: 400 });
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { cycleLength: true },
  });
  if (!userData) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  const cycle = await prisma.cycle.create({
    data: { userId: user.id, startDate: new Date(startDate), cycleLength: userData.cycleLength },
  });
  return NextResponse.json(cycle, { status: 201 });
}
