import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { getUser } from "@/src/lib/get-user";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const logs = await prisma.dailyLog.findMany({
    where: {
      userId: user.id,
      date: { gte: thirtyDaysAgo },
    },
    orderBy: { date: "asc" },
    select: {
      date: true,
      mood: true,
      energy: true,
      symptoms: true,
    },
  });

  return NextResponse.json(logs);
}
