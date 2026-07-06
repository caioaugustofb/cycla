import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/db";

const onboardingSchema = z.object ({
  lastPeriodDate: z.string().min(1),
  cycleLength: z.number().min(21).max(45),
});

export async function POST(request: Request) {
  const session = await auth();

  if(!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();

  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { lastPeriodDate, cycleLength } = parsed.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { cycleLength },
  });

  await prisma.cycle.create({
    data: {
      userId: session.user.id,
      startDate: new Date(lastPeriodDate),
      cycleLength,
    },
  });

  return NextResponse.json({ success: true });
}