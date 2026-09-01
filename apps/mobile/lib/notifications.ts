import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { calculateCycleStatus, type CyclePhase } from "@cycla/core";
import { apiFetch } from "./api";
import { pickMessage, pickPeriodMessage } from "./notification-messages";

const CHANNEL_ID = "exercise-reminders";
const PERIOD_CHANNEL_ID = "period-reminders";
const EXERCISE_TAG = "exercise-reminder";
const PERIOD_TAG = "period-reminder";
const DAYS_AHEAD = 14;
const PERIOD_WARNING_DAYS = 3;
const PERIOD_REMINDER_HOUR = 10;
const PERIOD_REMINDER_MINUTE = 0;

const PHASE_TIMES: Record<CyclePhase, { hour: number; minute: number }[]> = {
  menstrual: [{ hour: 9, minute: 0 }],
  follicular: [{ hour: 8, minute: 0 }],
  ovulatory: [
    { hour: 8, minute: 0 },
    { hour: 17, minute: 0 },
  ],
  luteal: [{ hour: 9, minute: 0 }],
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationSetup(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  let granted = settings.granted;
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted;
  }
  if (!granted) return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Lembretes de treino",
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: "#7C6FCD",
    });
    await Notifications.setNotificationChannelAsync(PERIOD_CHANNEL_ID, {
      name: "Aviso de menstruação",
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: "#7C6FCD",
    });
  }
  return true;
}

async function cancelExerciseReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.tag === EXERCISE_TAG)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

export type ScheduleResult =
  | { ok: true; count: number }
  | { ok: false; reason: "permission" | "no-cycle" | "error" };

export async function scheduleExerciseReminders(): Promise<ScheduleResult> {
  const granted = await ensureNotificationSetup();
  if (!granted) return { ok: false, reason: "permission" };

  const res = await apiFetch("/api/cycle");
  if (!res.ok) return { ok: false, reason: "error" };
  const cycles = await res.json();
  if (!Array.isArray(cycles) || cycles.length === 0) {
    return { ok: false, reason: "no-cycle" };
  }

  const { startDate, cycleLength } = cycles[0];
  const length = cycleLength ?? 28;

  await cancelExerciseReminders();

  const now = new Date();
  let lastBody: string | undefined;
  let count = 0;

  for (let d = 0; d < DAYS_AHEAD; d++) {
    const day = new Date(now);
    day.setDate(now.getDate() + d);
    day.setHours(0, 0, 0, 0);

    const phase = calculateCycleStatus(startDate, length, day).phase;

    for (const t of PHASE_TIMES[phase]) {
      const fireAt = new Date(day);
      fireAt.setHours(t.hour, t.minute, 0, 0);
      if (fireAt.getTime() <= now.getTime()) continue;

      const msg = pickMessage(phase, lastBody);
      lastBody = msg.body;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: msg.title,
          body: msg.body,
          data: { tag: EXERCISE_TAG, phase },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireAt,
          channelId: CHANNEL_ID,
        },
      });
      count++;
    }
  }

  return { ok: true, count };
}

export async function disableExerciseReminders() {
  await cancelExerciseReminders();
}

async function cancelPeriodReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.tag === PERIOD_TAG)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

export async function schedulePeriodReminders(): Promise<ScheduleResult> {
  const granted = await ensureNotificationSetup();
  if (!granted) return { ok: false, reason: "permission" };

  const res = await apiFetch("/api/cycle");
  if (!res.ok) return { ok: false, reason: "error" };
  const cycles = await res.json();
  if (!Array.isArray(cycles) || cycles.length === 0) {
    return { ok: false, reason: "no-cycle" };
  }

  const { startDate, cycleLength } = cycles[0];
  const status = calculateCycleStatus(startDate, cycleLength ?? 28);

  await cancelPeriodReminders();

  // nextPeriodDate é meia-noite UTC; reconstruir no calendário local para agendar no horário certo.
  const next = new Date(status.nextPeriodDate);
  const nextLocal = new Date(
    next.getUTCFullYear(),
    next.getUTCMonth(),
    next.getUTCDate(),
  );

  const now = new Date();
  let count = 0;

  const schedule: { daysBefore: number; kind: "approaching" | "tomorrow" }[] = [
    { daysBefore: PERIOD_WARNING_DAYS, kind: "approaching" },
    { daysBefore: 1, kind: "tomorrow" },
  ];

  for (const { daysBefore, kind } of schedule) {
    const fireAt = new Date(nextLocal);
    fireAt.setDate(nextLocal.getDate() - daysBefore);
    fireAt.setHours(PERIOD_REMINDER_HOUR, PERIOD_REMINDER_MINUTE, 0, 0);
    if (fireAt.getTime() <= now.getTime()) continue;

    const msg = pickPeriodMessage(kind);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: msg.title,
        body: msg.body,
        data: { tag: PERIOD_TAG, kind },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
        channelId: PERIOD_CHANNEL_ID,
      },
    });
    count++;
  }

  return { ok: true, count };
}

export async function disablePeriodReminders() {
  await cancelPeriodReminders();
}
