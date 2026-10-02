import { View, Text } from "react-native";
import { PressableScale } from "@/components/PressableScale";

export type ChipOption<T> = { value: T; label: string };

type Props<T> = {
  options: ChipOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
};

export function OptionChips<T extends string | boolean>({ options, value, onChange }: Props<T>) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <PressableScale
            key={String(opt.value)}
            onPress={() => onChange(opt.value)}
            className="px-4 py-2.5 rounded-xl border"
            style={{
              backgroundColor: active ? "#7C6FCD" : "#F5F0FF",
              borderColor: active ? "#7C6FCD" : "rgba(124,111,205,0.15)",
            }}
          >
            <Text
              className="text-base font-medium"
              style={{ color: active ? "#fff" : "#6B7280" }}
            >
              {opt.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}
