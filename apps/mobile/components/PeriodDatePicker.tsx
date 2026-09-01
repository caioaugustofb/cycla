import { useMemo, useState } from "react";
import { View, Text, Modal, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { PressableScale } from "@/components/PressableScale";

const DAY_NAMES = ["D", "S", "T", "Q", "Q", "S", "S"];

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function legendFor(date: Date): string {
  const diff = daysBetween(date, new Date());
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
};

export function PeriodDatePicker({ visible, onClose, onConfirm }: Props) {
  const today = startOfDay(new Date());
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Date>(today);
  const [viewMonth, setViewMonth] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const days = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const startPadding = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();
    const list: (Date | null)[] = [
      ...Array(startPadding).fill(null),
      ...Array.from({ length: total }, (_, i) => new Date(year, month, i + 1)),
    ];
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [viewMonth]);

  const isCurrentMonth =
    viewMonth.getFullYear() === today.getFullYear() &&
    viewMonth.getMonth() === today.getMonth();

  function shiftMonth(delta: number) {
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  function handleOpen() {
    setSelected(today);
    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      onShow={handleOpen}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(160)}
          style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(17,24,39,0.45)" }]}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        <Animated.View
          entering={SlideInDown.duration(280)}
          exiting={SlideOutDown.duration(200)}
          style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: insets.bottom + 20,
          }}
        >
          <View
            style={{
              alignSelf: "center",
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#E5E7EB",
              marginBottom: 16,
            }}
          />

          <Text className="text-lg font-semibold text-foreground text-center">
            Quando sua menstruação começou?
          </Text>

          <View
            className="self-center rounded-full px-4 py-1.5 mt-3 mb-5"
            style={{ backgroundColor: "#F5F0FF" }}
          >
            <Text className="text-base font-semibold" style={{ color: "#7C6FCD" }}>
              {legendFor(selected)}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mb-3">
            <PressableScale onPress={() => shiftMonth(-1)} className="p-2">
              <ChevronLeft size={22} color="#7C6FCD" />
            </PressableScale>
            <Text className="text-base font-semibold text-foreground">
              {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </Text>
            <PressableScale
              onPress={() => shiftMonth(1)}
              disabled={isCurrentMonth}
              className="p-2"
              style={{ opacity: isCurrentMonth ? 0.25 : 1 }}
            >
              <ChevronRight size={22} color="#7C6FCD" />
            </PressableScale>
          </View>

          <View style={{ flexDirection: "row", marginBottom: 6 }}>
            {DAY_NAMES.map((d, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: 12, color: "#9CA3AF", fontWeight: "500" }}>
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {Array.from({ length: days.length / 7 }, (_, row) => (
            <View key={row} style={{ flexDirection: "row", marginBottom: 4 }}>
              {days.slice(row * 7, row * 7 + 7).map((day, col) => {
                if (!day) return <View key={col} style={{ flex: 1 }} />;
                const future = daysBetween(day, today) < 0;
                const isSelected = sameDay(day, selected);
                const isToday = sameDay(day, today);
                return (
                  <View key={col} style={{ flex: 1, alignItems: "center", paddingVertical: 2 }}>
                    <Pressable
                      disabled={future}
                      onPress={() => setSelected(day)}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isSelected ? "#7C6FCD" : "transparent",
                        borderWidth: !isSelected && isToday ? 1.5 : 0,
                        borderColor: "#C4B5FD",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: isSelected || isToday ? "700" : "400",
                          color: future
                            ? "#D1D5DB"
                            : isSelected
                              ? "#fff"
                              : isToday
                                ? "#7C6FCD"
                                : "#111827",
                        }}
                      >
                        {day.getDate()}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}

          <View className="flex-row gap-3 mt-5">
            <PressableScale
              onPress={onClose}
              className="flex-1 rounded-2xl py-3.5 items-center border border-border"
            >
              <Text className="text-base font-semibold text-muted">Cancelar</Text>
            </PressableScale>
            <PressableScale
              onPress={() => onConfirm(selected)}
              haptic
              className="flex-1 rounded-2xl py-3.5 items-center bg-primary"
            >
              <Text className="text-base font-semibold text-white">Registrar</Text>
            </PressableScale>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
