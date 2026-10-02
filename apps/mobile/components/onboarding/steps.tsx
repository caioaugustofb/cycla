import { ReactNode } from "react";
import { View } from "react-native";
import { Text, TextInput } from "@/components/ui/Text";
import { CalendarDays } from "lucide-react-native";
import { PressableScale } from "@/components/PressableScale";
import { OptionChips, type ChipOption } from "@/components/OptionChips";

const KNOWS_OPTIONS: ChipOption<boolean>[] = [
  { value: false, label: "Não sei" },
  { value: true, label: "Sei" },
];

export function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View className="gap-2">
      <Text className="text-title font-serif text-foreground">{title}</Text>
      <Text className="text-base text-muted">{subtitle}</Text>
    </View>
  );
}

export function DateField({ date, onPress }: { date: Date | null; onPress: () => void }) {
  return (
    <PressableScale
      onPress={onPress}
      className="bg-white border border-border rounded-xl flex-row items-center justify-between px-4"
      style={{ height: 52 }}
    >
      <Text className="text-base" style={{ color: date ? "#111827" : "#9ca3af" }}>
        {date
          ? date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
          : "Escolher data"}
      </Text>
      <CalendarDays size={20} color="#7C6FCD" />
    </PressableScale>
  );
}

type NumberQuestionProps = {
  knows: boolean;
  onKnowsChange: (value: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  unknownHint: string;
  children?: ReactNode;
};

export function NumberQuestion({
  knows,
  onKnowsChange,
  value,
  onValueChange,
  unknownHint,
  children,
}: NumberQuestionProps) {
  return (
    <View className="gap-3">
      <OptionChips options={KNOWS_OPTIONS} value={knows} onChange={onKnowsChange} />
      {knows ? (
        <View className="gap-3">
          <View className="flex-row items-center gap-3">
            <TextInput
              className="bg-white border border-border rounded-xl text-foreground w-16"
              style={{ height: 40, paddingHorizontal: 8, fontSize: 16, textAlign: "center" }}
              value={value}
              onChangeText={(t) => onValueChange(t.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text className="text-base text-muted">dias</Text>
          </View>
          {children}
        </View>
      ) : (
        <Text className="text-sm text-muted">{unknownHint}</Text>
      )}
    </View>
  );
}
