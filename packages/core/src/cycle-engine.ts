export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal";

export interface CycleStatus {
  currentDay: number;
  phase: CyclePhase;
  phaseDay: number;
  daysLeftInPhase: number;
  nextPeriodDate: Date;
  /** true quando o ciclo passou da duração prevista sem um novo registro. */
  isLate: boolean;
  /** Dias de atraso. 0 = menstruação esperada hoje. */
  daysLate: number;
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

  // startDate vem como meia-noite UTC; setHours() usaria o fuso local e perderia um dia em UTC-3.
  const rawStart = new Date(lastPeriodDate);
  const start = new Date(
    Date.UTC(rawStart.getUTCFullYear(), rawStart.getUTCMonth(), rawStart.getUTCDate()),
  );

  const rawToday = new Date(today);
  const now = new Date(
    Date.UTC(rawToday.getFullYear(), rawToday.getMonth(), rawToday.getDate()),
  );

  const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / msPerDay);

  // Sem registro novo não há como saber que o ciclo recomeçou: entra em atraso, não avança.
  const nextPeriodDate = new Date(start.getTime() + cycleLength * msPerDay);
  const isLate = daysSinceStart >= cycleLength;
  const daysLate = isLate ? daysSinceStart - cycleLength : 0;

  const currentDay = daysSinceStart + 1;

  if (isLate) {
    return {
      currentDay,
      phase: "luteal",
      phaseDay: currentDay - 16,
      daysLeftInPhase: 0,
      nextPeriodDate,
      isLate: true,
      daysLate,
      phaseInfo: {
        name: "Atrasada",
        label: "Atraso",
        energy: "Variável",
        description:
          daysLate === 0
            ? "Sua menstruação é esperada hoje. Registre quando ela começar."
            : `Sua menstruação está atrasada há ${daysLate} ${
                daysLate === 1 ? "dia" : "dias"
              }. Registre quando ela começar.`,
      },
    };
  }

  const phase = getPhase(currentDay);
  const phaseEndDay = getPhaseEndDay(phase, cycleLength);
  const phaseDay =
    currentDay -
    (phase === "menstrual" ? 0 : phase === "follicular" ? 5 : phase === "ovulatory" ? 12 : 16);
  const daysLeftInPhase = phaseEndDay - currentDay;

  return {
    currentDay,
    phase,
    phaseDay,
    daysLeftInPhase,
    nextPeriodDate,
    isLate: false,
    daysLate: 0,
    phaseInfo: PHASE_INFO[phase],
  };
}

const MIN_REASONABLE_CYCLE = 15;
const MAX_REASONABLE_CYCLE = 60;
const MAX_CYCLES_CONSIDERED = 6;
const MIN_SAMPLES = 2;

//intervalos fora da faixa razoável indicam registro perdido, não um ciclo real
export function averageCycleLength(
  startDates: (Date | string)[],
  fallback: number,
): number {
  const days = startDates
    .map((d) => {
      const x = new Date(d);
      return Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
    })
    .sort((a, b) => b - a);

  const gaps: number[] = [];
  for (let i = 0; i < days.length - 1 && gaps.length < MAX_CYCLES_CONSIDERED; i++) {
    const gap = Math.round((days[i] - days[i + 1]) / 86400000);
    if (gap >= MIN_REASONABLE_CYCLE && gap <= MAX_REASONABLE_CYCLE) gaps.push(gap);
  }

  if (gaps.length < MIN_SAMPLES) return fallback;
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}