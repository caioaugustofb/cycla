import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import { GildaDisplay_400Regular } from "@expo-google-fonts/gilda-display";

export const FONT_ASSETS = {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  GildaDisplay_400Regular,
};

// Valor que a classe font-serif do Tailwind entrega; o componente Text troca pela Gilda real.
export const SERIF_MARKER = "GildaDisplay";

export const BODY_FONT = "Nunito_400Regular";

function toNumericWeight(weight: unknown): number {
  if (weight === "bold") return 700;
  if (typeof weight === "number") return weight;
  if (typeof weight === "string" && /^\d+$/.test(weight)) return Number(weight);
  return 400;
}

export function resolveFontFamily(weight: unknown, serif = false): string {
  const w = toNumericWeight(weight);
  // A Gilda tem um peso só, que é o que conversa com a logo.
  if (serif) return "GildaDisplay_400Regular";
  if (w >= 700) return "Nunito_700Bold";
  if (w >= 600) return "Nunito_600SemiBold";
  if (w >= 500) return "Nunito_500Medium";
  return "Nunito_400Regular";
}
