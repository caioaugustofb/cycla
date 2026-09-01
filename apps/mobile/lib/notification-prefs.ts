import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@cycla:exercise-reminders";
const PERIOD_KEY = "@cycla:period-reminders";

export async function getExerciseRemindersEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY)) === "1";
}

export async function setExerciseRemindersEnabled(enabled: boolean) {
  await AsyncStorage.setItem(KEY, enabled ? "1" : "0");
}

export async function getPeriodRemindersEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(PERIOD_KEY)) === "1";
}

export async function setPeriodRemindersEnabled(enabled: boolean) {
  await AsyncStorage.setItem(PERIOD_KEY, enabled ? "1" : "0");
}