export const CONTRACEPTIVES = [
  "none",
  "pill",
  "hormonal_iud",
  "implant",
  "injection",
  "copper_iud",
] as const;
export type Contraceptive = (typeof CONTRACEPTIVES)[number];

const HORMONAL_CONTRACEPTIVES: readonly Contraceptive[] = [
  "pill",
  "hormonal_iud",
  "implant",
  "injection",
];

export function isHormonalContraceptive(value: string | null | undefined): boolean {
  return HORMONAL_CONTRACEPTIVES.includes(value as Contraceptive);
}

export const CYCLE_REGULARITIES = ["regular", "irregular"] as const;
export type CycleRegularity = (typeof CYCLE_REGULARITIES)[number];

export const REMINDER_PERIODS = ["morning", "afternoon", "night"] as const;
export type ReminderPeriod = (typeof REMINDER_PERIODS)[number];

export const REMINDER_HOURS: Record<ReminderPeriod, number> = {
  morning: 8,
  afternoon: 13,
  night: 19,
};

export const DEFAULT_PERIOD_LENGTH = 5;
export const MIN_PERIOD_LENGTH = 2;
export const MAX_PERIOD_LENGTH = 10;
