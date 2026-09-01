import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { getUser } from "@/src/lib/get-user";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const cycle = await prisma.cycle.findUnique({ where: { id } });

  if (!cycle || cycle.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.cycle.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
