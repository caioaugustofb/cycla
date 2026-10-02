import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/Text";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  DEFAULT_PERIOD_LENGTH,
  MIN_PERIOD_LENGTH,
  MAX_PERIOD_LENGTH,
  type Contraceptive,
  type CycleRegularity,
  type ReminderPeriod,
} from "@cycla/core";
import { apiFetch } from "@/lib/api";
import { getExerciseRemindersEnabled } from "@/lib/notification-prefs";
import { scheduleExerciseReminders } from "@/lib/notifications";
import { resetHormonalNote } from "@/lib/hints";
import { PressableScale } from "@/components/PressableScale";
import { OptionChips, type ChipOption } from "@/components/OptionChips";
import { NumberQuestion } from "@/components/onboarding/steps";
import { useToast } from "@/components/Toast";

const UNSET = "unset";
type Unset = typeof UNSET;

const REGULARITY_OPTIONS: ChipOption<CycleRegularity | Unset>[] = [
  { value: "regular", label: "Regular" },
  { value: "irregular", label: "Irregular" },
  { value: UNSET, label: "Não sei" },
];

const CONTRACEPTIVE_OPTIONS: ChipOption<Contraceptive | Unset>[] = [
  { value: "none", label: "Não uso" },
  { value: "pill", label: "Pílula" },
  { value: "hormonal_iud", label: "DIU hormonal" },
  { value: "copper_iud", label: "DIU de cobre" },
  { value: "implant", label: "Implante" },
  { value: "injection", label: "Injeção" },
  { value: UNSET, label: "Prefiro não informar" },
];

const REMINDER_OPTIONS: ChipOption<ReminderPeriod | Unset>[] = [
  { value: "morning", label: "Manhã (8h)" },
  { value: "afternoon", label: "Tarde (13h)" },
  { value: "night", label: "Noite (19h)" },
  { value: UNSET, label: "Automático" },
];

function orNull<T extends string>(value: T | Unset): T | null {
  return value === UNSET ? null : value;
}

function Section({
  title,
  description,
  delay,
  children,
}: {
  title: string;
  description: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(250)}
      className="bg-white rounded-2xl p-4 border border-border gap-3"
    >
      <View className="gap-1">
        <Text className="text-lg font-semibold text-foreground">{title}</Text>
        <Text className="text-sm text-muted">{description}</Text>
      </View>
      {children}
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [knowsPeriod, setKnowsPeriod] = useState(false);
  const [periodLength, setPeriodLength] = useState(String(DEFAULT_PERIOD_LENGTH));
  const [regularity, setRegularity] = useState<CycleRegularity | Unset>(UNSET);
  const [contraceptive, setContraceptive] = useState<Contraceptive | Unset>(UNSET);
  const [reminderPeriod, setReminderPeriod] = useState<ReminderPeriod | Unset>(UNSET);
  const [savedContraceptive, setSavedContraceptive] = useState<Contraceptive | Unset>(UNSET);

  useEffect(() => {
    async function load() {
      const res = await apiFetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setKnowsPeriod(data.periodLength != null);
        setPeriodLength(String(data.periodLength ?? DEFAULT_PERIOD_LENGTH));
        setRegularity(data.cycleRegularity ?? UNSET);
        setContraceptive(data.contraceptive ?? UNSET);
        setSavedContraceptive(data.contraceptive ?? UNSET);
        setReminderPeriod(data.reminderPeriod ?? UNSET);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    const periodNum = parseInt(periodLength, 10);
    if (
      knowsPeriod &&
      (isNaN(periodNum) || periodNum < MIN_PERIOD_LENGTH || periodNum > MAX_PERIOD_LENGTH)
    ) {
      toast.error(`A menstruação deve durar entre ${MIN_PERIOD_LENGTH} e ${MAX_PERIOD_LENGTH} dias.`);
      return;
    }

    setSaving(true);
    const res = await apiFetch("/api/settings", {
      method: "PATCH",
      body: JSON.stringify({
        periodLength: knowsPeriod ? periodNum : null,
        cycleRegularity: orNull(regularity),
        contraceptive: orNull(contraceptive),
        reminderPeriod: orNull(reminderPeriod),
      }),
    });

    if (!res.ok) {
      setSaving(false);
      toast.error("Não foi possível salvar. Tente novamente.");
      return;
    }

    if (contraceptive !== savedContraceptive) await resetHormonalNote();

    // Horário e duração da menstruação mudam os lembretes já agendados.
    if (await getExerciseRemindersEnabled()) await scheduleExerciseReminders();

    setSaving(false);
    toast.success("Respostas salvas.");
    router.back();
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color="#7C6FCD" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24, gap: 20 }}
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center gap-2">
          <PressableScale onPress={() => router.back()} className="p-1 -ml-1">
            <ChevronLeft size={24} color="#111827" />
          </PressableScale>
          <View className="flex-1">
            <Text className="text-title font-serif text-primary">Sobre você</Text>
            <Text className="text-base text-muted">Usado para personalizar fases e lembretes</Text>
          </View>
        </View>

        <Section
          title="Duração da menstruação"
          description="Os dias de sangramento, em média. Define quanto dura a fase menstrual."
          delay={0}
        >
          <NumberQuestion
            knows={knowsPeriod}
            onKnowsChange={setKnowsPeriod}
            value={periodLength}
            onValueChange={setPeriodLength}
            unknownHint={`Sem problema. Usamos ${DEFAULT_PERIOD_LENGTH} dias, que é a média.`}
          />
        </Section>

        <Section
          title="Regularidade do ciclo"
          description="Para ciclos irregulares, o app trata alguns dias de diferença como normais."
          delay={50}
        >
          <OptionChips options={REGULARITY_OPTIONS} value={regularity} onChange={setRegularity} />
        </Section>

        <Section
          title="Método contraceptivo"
          description="Métodos hormonais mudam como as fases funcionam."
          delay={100}
        >
          <OptionChips
            options={CONTRACEPTIVE_OPTIONS}
            value={contraceptive}
            onChange={setContraceptive}
          />
        </Section>

        <Section
          title="Horário dos lembretes"
          description="Quando enviar os lembretes de treino. No automático, cada fase tem seu horário."
          delay={150}
        >
          <OptionChips
            options={REMINDER_OPTIONS}
            value={reminderPeriod}
            onChange={setReminderPeriod}
          />
        </Section>

        <Animated.View entering={FadeInDown.delay(200).duration(250)}>
          <PressableScale
            onPress={handleSave}
            disabled={saving}
            haptic
            className="bg-primary rounded-2xl py-4 items-center"
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">Salvar</Text>
            )}
          </PressableScale>
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
