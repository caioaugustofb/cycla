import { useEffect, useState } from "react";
import { View, Text, Image, ActivityIndicator, BackHandler } from "react-native";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { ChevronLeft, AlertTriangle, Lock } from "lucide-react-native";
import {
  MIN_PERIOD_LENGTH,
  MAX_PERIOD_LENGTH,
  type Contraceptive,
  type CycleRegularity,
  type ReminderPeriod,
} from "@cycla/core";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { PressableScale } from "@/components/PressableScale";
import { PeriodDatePicker } from "@/components/PeriodDatePicker";
import { OptionChips, type ChipOption } from "@/components/OptionChips";
import { StepHeader, DateField, NumberQuestion } from "@/components/onboarding/steps";

const TOTAL_STEPS = 6;

type Regularity = CycleRegularity | "unknown";

const REGULARITY_OPTIONS: ChipOption<Regularity>[] = [
  { value: "regular", label: "Regular" },
  { value: "irregular", label: "Irregular" },
  { value: "unknown", label: "Não sei" },
];

const CONTRACEPTIVE_OPTIONS: ChipOption<Contraceptive>[] = [
  { value: "none", label: "Não uso" },
  { value: "pill", label: "Pílula" },
  { value: "hormonal_iud", label: "DIU hormonal" },
  { value: "copper_iud", label: "DIU de cobre" },
  { value: "implant", label: "Implante" },
  { value: "injection", label: "Injeção" },
];

const REMINDER_OPTIONS: ChipOption<ReminderPeriod>[] = [
  { value: "morning", label: "Manhã (8h)" },
  { value: "afternoon", label: "Tarde (13h)" },
  { value: "night", label: "Noite (19h)" },
];

function toLocalISODate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function OnboardingScreen() {
  const router = useRouter();
  const toast = useToast();
  const { finalizeLogin, logout } = useAuth();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromRegister = from === "register";

  const [step, setStep] = useState(0);
  const [lastPeriodDate, setLastPeriodDate] = useState<Date | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [knowsCycle, setKnowsCycle] = useState(false);
  const [cycleLength, setCycleLength] = useState("28");
  const [knowsPeriod, setKnowsPeriod] = useState(false);
  const [periodLength, setPeriodLength] = useState("5");
  const [regularity, setRegularity] = useState<Regularity | null>(null);
  const [contraceptive, setContraceptive] = useState<Contraceptive | null>(null);
  const [reminderPeriod, setReminderPeriod] = useState<ReminderPeriod | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLastStep = step === TOTAL_STEPS - 1;
  const cycleLengthNum = parseInt(cycleLength, 10);
  const showOligomenorrheaWarning =
    knowsCycle && cycleLengthNum > 35 && cycleLengthNum <= 45;

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [step, fromRegister, loading]);

  function validateStep(): string | null {
    if (step === 0 && !lastPeriodDate) {
      return "Escolha a data da sua última menstruação.";
    }
    if (step === 1 && knowsCycle && (isNaN(cycleLengthNum) || cycleLengthNum < 21 || cycleLengthNum > 45)) {
      return "A duração do ciclo deve ficar entre 21 e 45 dias.";
    }
    const periodNum = parseInt(periodLength, 10);
    if (
      step === 2 &&
      knowsPeriod &&
      (isNaN(periodNum) || periodNum < MIN_PERIOD_LENGTH || periodNum > MAX_PERIOD_LENGTH)
    ) {
      return `A menstruação deve durar entre ${MIN_PERIOD_LENGTH} e ${MAX_PERIOD_LENGTH} dias.`;
    }
    return null;
  }

  function goNext() {
    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    if (isLastStep) submit(reminderPeriod);
    else setStep((s) => s + 1);
  }

  function skip() {
    setError("");
    if (step === 1) setKnowsCycle(false);
    if (step === 2) setKnowsPeriod(false);
    if (step === 3) setRegularity(null);
    if (step === 4) setContraceptive(null);
    if (isLastStep) submit(null);
    else setStep((s) => s + 1);
  }

  async function goBack() {
    if (loading) return;
    setError("");
    if (step > 0) {
      setStep((s) => s - 1);
      return;
    }
    if (!fromRegister) {
      router.back();
      return;
    }
    setLoading(true);
    const res = await apiFetch("/api/auth/register", { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      toast.error("Não foi possível voltar. Tente novamente.");
      return;
    }
    await logout();
    router.back();
  }

  async function submit(reminder: ReminderPeriod | null) {
    if (!lastPeriodDate) return;
    setLoading(true);
    const res = await apiFetch("/api/onboarding", {
      method: "POST",
      body: JSON.stringify({
        lastPeriodDate: toLocalISODate(lastPeriodDate),
        ...(knowsCycle && { cycleLength: cycleLengthNum }),
        ...(knowsPeriod && { periodLength: parseInt(periodLength, 10) }),
        ...(regularity && regularity !== "unknown" && { cycleRegularity: regularity }),
        ...(contraceptive && { contraceptive }),
        ...(reminder && { reminderPeriod: reminder }),
      }),
    });
    setLoading(false);

    if (!res.ok) {
      setError("Não foi possível salvar. Tente novamente.");
      return;
    }

    await finalizeLogin();
    router.replace("/(app)/dashboard");
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <>
            <Image
              source={require("../../assets/icon-foreground.png")}
              style={{ width: 96, height: 96, alignSelf: "center" }}
              resizeMode="contain"
            />
            <StepHeader
              title="Quase lá!"
              subtitle="Algumas perguntas rápidas para o app acompanhar o seu ciclo."
            />
            <View className="gap-2">
              <Text className="text-base font-medium text-foreground">
                Quando começou sua última menstruação?
              </Text>
              <DateField date={lastPeriodDate} onPress={() => setPickerOpen(true)} />
            </View>
            <View className="flex-row gap-2 rounded-xl p-3" style={{ backgroundColor: "#F5F0FF" }}>
              <Lock size={16} color="#7C6FCD" style={{ marginTop: 2, flexShrink: 0 }} />
              <Text className="text-sm flex-1" style={{ color: "#5B4FA8" }}>
                Usamos suas respostas apenas para personalizar suas previsões. Só esta data é
                obrigatória.
              </Text>
            </View>
          </>
        );
      case 1:
        return (
          <>
            <StepHeader
              title="Quanto dura o seu ciclo?"
              subtitle="Do primeiro dia de uma menstruação até o primeiro dia da próxima."
            />
            <NumberQuestion
              knows={knowsCycle}
              onKnowsChange={setKnowsCycle}
              value={cycleLength}
              onValueChange={setCycleLength}
              unknownHint="Sem problema. O app calcula a duração a partir dos seus registros."
            >
              {showOligomenorrheaWarning && (
                <View className="flex-row gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <AlertTriangle size={16} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Text className="text-sm text-amber-800 flex-1">
                    Ciclos acima de 35 dias podem indicar{" "}
                    <Text className="font-semibold">oligomenorreia</Text> - associada a SOP,
                    hipotireoidismo ou alterações hormonais. Considere consultar um ginecologista.
                  </Text>
                </View>
              )}
            </NumberQuestion>
          </>
        );
      case 2:
        return (
          <>
            <StepHeader
              title="Quantos dias dura a sua menstruação?"
              subtitle="Os dias de sangramento, em média."
            />
            <NumberQuestion
              knows={knowsPeriod}
              onKnowsChange={setKnowsPeriod}
              value={periodLength}
              onValueChange={setPeriodLength}
              unknownHint="Sem problema. Usamos 5 dias, que é a média."
            />
          </>
        );
      case 3:
        return (
          <>
            <StepHeader
              title="Seu ciclo costuma ser regular?"
              subtitle="Regular é quando a menstruação vem com poucos dias de diferença de um mês para o outro."
            />
            <OptionChips options={REGULARITY_OPTIONS} value={regularity} onChange={setRegularity} />
          </>
        );
      case 4:
        return (
          <>
            <StepHeader
              title="Você usa algum método contraceptivo?"
              subtitle="Métodos hormonais mudam como as fases funcionam. Saber disso deixa o app mais honesto com você."
            />
            <OptionChips
              options={CONTRACEPTIVE_OPTIONS}
              value={contraceptive}
              onChange={setContraceptive}
            />
          </>
        );
      default:
        return (
          <>
            <StepHeader
              title="Quando prefere receber os lembretes?"
              subtitle="Usamos esse horário para os lembretes de treino."
            />
            <OptionChips
              options={REMINDER_OPTIONS}
              value={reminderPeriod}
              onChange={setReminderPeriod}
            />
          </>
        );
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <Stack.Screen options={{ gestureEnabled: false }} />

      <View className="flex-row items-center px-4 pt-2 gap-3">
        <PressableScale onPress={goBack} disabled={loading} className="p-2" hitSlop={8}>
          <ChevronLeft size={24} color="#7C6FCD" />
        </PressableScale>
        <View className="flex-1 flex-row gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View
              key={i}
              className="flex-1 rounded-full"
              style={{ height: 6, backgroundColor: i <= step ? "#7C6FCD" : "#E5E7EB" }}
            />
          ))}
        </View>
        <Text className="text-sm text-muted" style={{ fontVariant: ["tabular-nums"] }}>
          {step + 1}/{TOTAL_STEPS}
        </Text>
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={120}
      >
        <Animated.View key={step} entering={FadeIn.duration(220)} className="gap-5">
          {renderStep()}
        </Animated.View>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ opened: 0, closed: 0 }}>
        <View className="px-6 pb-4 pt-2 gap-1 bg-surface">
          {error ? <Text className="text-sm text-red-500 text-center mb-2">{error}</Text> : null}
          <PressableScale
            onPress={goNext}
            disabled={loading}
            haptic
            className="bg-primary rounded-2xl py-4 items-center"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                {isLastStep ? "Começar" : "Continuar"}
              </Text>
            )}
          </PressableScale>
          {step > 0 && (
            <PressableScale onPress={skip} disabled={loading} className="py-3 items-center">
              <Text className="text-base text-muted">Pular</Text>
            </PressableScale>
          )}
        </View>
      </KeyboardStickyView>

      <PeriodDatePicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={(date) => {
          setLastPeriodDate(date);
          setPickerOpen(false);
          setError("");
        }}
      />
    </SafeAreaView>
  );
}
