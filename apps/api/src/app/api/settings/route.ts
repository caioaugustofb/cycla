import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { z } from "zod/v4";
import { getUser } from "@/src/lib/get-user";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, cycleLength: true },
  });

  return NextResponse.json(userData);
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  cycleLength: z.number().int().min(21).max(45).optional(),
});

export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const userData = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
    select: { name: true, email: true, cycleLength: true },
  });

  return NextResponse.json(userData);
}
