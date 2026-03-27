import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import { calculateCycleStatus, CyclePhase } from "@/src/lib/cycle-engine";
import { prisma } from "@/src/lib/db";

const PHASE_COLORS: Record<CyclePhase, string> = {
  menstrual: "bg-bg-pink",
  follicular: "bg-bg-purple",
  ovulatory: "bg-accent-light",
  luteal: "bg-bg",
};

const PHASE_EMOJI: Record<CyclePhase, string> = {
  menstrual: "🌙",
  follicular: "🌱",
  ovulatory: "☀️",
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
        <p className="text-medium text-sm">Olá, {user.name.split(" ")[0]}</p>
        <h1 className="text-2xl font-bold text-dark">Seu ciclo</h1>
      </div>

      <div className={`rounded-2xl p-5 flex flex-col gap-3 ${PHASE_COLORS[status.phase]}`}>
        <div className="flex items-center justify-between">
          <span className="text-4xl">{PHASE_EMOJI[status.phase]}</span>
          <span className="text-sm text-medium">Dia {status.currentDay} do ciclo</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-dark">
            Fase {status.phaseInfo.name}
          </h2>
          <p className="text-medium text-sm mt-1">{status.phaseInfo.description}</p>
        </div>
        <div className="flex gap-4 mt-1">
          <div>
            <p className="text-xs text-muted">Energia</p>
            <p className="text-sm font-semibold text-dark">{status.phaseInfo.energy}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Dias restantes na fase</p>
            <p className="text-sm font-semibold text-dark">{status.daysLeftInPhase} dias</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted">Próxima menstruação</p>
          <p className="text-sm font-semibold text-dark">{nextPeriod}</p>
        </div>
      </div>
    </div>
  );
}