export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal";

export interface CycleStatus {
  currentDay: number;
  phase: CyclePhase;
  phaseDay: number;
  daysLeftInPhase: number;
  nextPeriodDate: Date;
  phaseInfo: {
    name: string;
    energy: string;
    description: string;
    label: string;
  };
}

const PHASE_INFO: Record<CyclePhase, { name: string; energy: string; description: string; label: string }> = {
  menstrual: {
    name: "Menstrual",
    label: "Menstrual",
    energy: "Baixa",
    description: "Momento de descanso e autocuidado.",
  },
  follicular: {
    name: "Folicular",
    label: "Folicular",
    energy: "Alta",
    description: "Ótimo momento para novos projetos e desafios.",
  },
  ovulatory: {
    name: "Ovulatória",
    label: "Ovulatória",
    energy: "Máxima",
    description: "Seu pico de energia. Aproveite para grandes entregas.",
  },
  luteal: {
    name: "Lútea",
    label: "Lútea",
    energy: "Média",
    description: "Foco em revisão, organização e tarefas conhecidas.",
  },
};

function getPhase(cycleDay: number): CyclePhase {
  if (cycleDay <= 5) return "menstrual";
  if (cycleDay <= 12) return "follicular";
  if (cycleDay <= 16) return "ovulatory";
  return "luteal";
}

function getPhaseEndDay(phase: CyclePhase, cycleLength: number): number {
  if (phase === "menstrual") return 5;
  if (phase === "follicular") return 12;
  if (phase === "ovulatory") return 16;
  return cycleLength;
}

export function calculateCycleStatus(
  lastPeriodDate: Date | string,
  cycleLength: number,
  today: Date = new Date(),
): CycleStatus {
  const msPerDay = 1000 * 60 * 60 * 24;

  const start = new Date(lastPeriodDate);
  start.setHours(0, 0, 0, 0);

  const now = new Date(today);
  now.setHours(0, 0, 0, 0);

  const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / msPerDay);
  const currentDay = (daysSinceStart % cycleLength) + 1;

  const phase = getPhase(currentDay);
  const phaseEndDay = getPhaseEndDay(phase, cycleLength);
  const phaseDay =
    currentDay -
    (phase === "menstrual" ? 0 : phase === "follicular" ? 5 : phase === "ovulatory" ? 12 : 16);
  const daysLeftInPhase = phaseEndDay - currentDay;

  const cyclesCompleted = Math.floor(daysSinceStart / cycleLength);
  const nextPeriodDate = new Date(
    start.getTime() + (cyclesCompleted + 1) * cycleLength * msPerDay,
  );

  return {
    currentDay,
    phase,
    phaseDay,
    daysLeftInPhase,
    nextPeriodDate,
    phaseInfo: PHASE_INFO[phase],
  };
}
