import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import { calculateCycleStatus, CyclePhase } from "@/src/lib/cycle-engine";
import { prisma } from "@/src/lib/db";
import { Card, CardContent } from "@/src/components/ui/card";
import { CalendarDays, Zap, Timer } from "lucide-react";

const PHASE_GRADIENTS: Record<CyclePhase, string> = {
  menstrual: "from-[#EEF2FF] to-[#E8E4FF]",
  follicular: "from-[#EDE9FE] to-[#DDD6FE]",
  ovulatory: "from-[#DDD6FE] to-[#C4B5FD]",
  luteal: "from-[#F5F0FF] to-[#EDE9FE]",
};

const PHASE_ICONS: Record<CyclePhase, string> = {
  menstrual: "🌙",
  follicular: "🌱",
  ovulatory: "✨",
  luteal: "🍂",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, cycleLength: true },
  });

  const lastCycle = await prisma.cycle.findFirst({
    where: { userId: session.user.id },
    orderBy: { startDate: "desc" },
  });

  if (!user || !lastCycle) redirect("/onboarding");

  const status = calculateCycleStatus(lastCycle.startDate, user.cycleLength);

  const nextPeriod = status.nextPeriodDate.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col gap-4 py-6">
      <div>
        <p className="text-muted-foreground text-sm">Olá, {user.name.split(" ")[0]}</p>
        <h1 className="text-2xl font-bold text-foreground">Seu ciclo hoje</h1>
      </div>

      <div className={`rounded-2xl p-5 flex flex-col gap-3 bg-gradient-to-br ${PHASE_GRADIENTS[status.phase]}`}>
        <div className="flex items-center justify-between">
          <span className="text-3xl">{PHASE_ICONS[status.phase]}</span>
          <span className="text-sm text-muted-foreground bg-white/50 px-3 py-1 rounded-full">
            Dia {status.currentDay} do ciclo
          </span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Fase {status.phaseInfo.name}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">{status.phaseInfo.description}</p>
        </div>
        <div className="flex gap-3 mt-1">
          <div className="bg-white/50 rounded-xl px-3 py-2 flex items-center gap-2">
            <Zap size={14} className="text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Energia</p>
              <p className="text-sm font-semibold text-foreground">{status.phaseInfo.energy}</p>
            </div>
          </div>
          <div className="bg-white/50 rounded-xl px-3 py-2 flex items-center gap-2">
            <Timer size={14} className="text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Dias restantes</p>
              <p className="text-sm font-semibold text-foreground">{status.daysLeftInPhase} dias</p>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="text-xs text-muted-foreground">Próxima menstruação</p>
            <p className="text-sm font-semibold text-foreground">{nextPeriod}</p>
          </div>
          <CalendarDays size={20} className="text-primary" />
        </CardContent>
      </Card>
    </div>
  );
}
