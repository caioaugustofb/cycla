import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const from = new Date();
  from.setDate(from.getDate() - 29);
  from.setHours(0, 0, 0, 0);

  const logs = await prisma.dailyLog.findMany({
    where: { userId: session.user.id, date: { gte: from } },
    orderBy: { date: "asc" },
    select: { date: true, mood: true, energy: true, symptoms: true },
  });

  return NextResponse.json(logs);
}