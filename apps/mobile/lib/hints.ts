import AsyncStorage from "@react-native-async-storage/async-storage";

const HORMONAL_NOTE_KEY = "@cycla:hormonal-note-dismissed";

export async function isHormonalNoteDismissed(): Promise<boolean> {
  return (await AsyncStorage.getItem(HORMONAL_NOTE_KEY)) === "1";
}

export async function dismissHormonalNote() {
  await AsyncStorage.setItem(HORMONAL_NOTE_KEY, "1");
}

export async function resetHormonalNote() {
  await AsyncStorage.removeItem(HORMONAL_NOTE_KEY);
}
