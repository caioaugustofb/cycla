import type { CyclePhase } from "@cycla/core";

export type NotificationMessage = { title: string, body: string };

export const EXERCISE_MESSAGES: Record<CyclePhase, NotificationMessage[]> = {
  menstrual: [
    { title: "🌙 Vá no seu ritmo", body: "Se hoje for só um alongamento leve ou uma caminhada curta, já é o bastante. Seu corpo pede pausa." },
    { title: "🍃 Sem pressa hoje", body: "Movimento suave conta. Que tal alongar por alguns minutos e respirar fundo?" },
    { title: "🤍 Gentileza com você", body: "Descanso também é treino. Se sentir vontade, um alongamento leve cai bem." },
    { title: "☁️ Escute seu corpo", body: "Nada de cobrança hoje. Um movimento leve, do jeitinho que der, já é cuidar de você." },
  ],
  follicular: [
    { title: "🌱 Sua energia está voltando", body: "Ótimo dia pra treinar e aproveitar esse gás que está chegando. Bora?" },
    { title: "☀️ Bora aproveitar!", body: "Seu corpo está mais disposto agora? Que tal um treino para começar bem o dia?" },
    { title: "✨ Momento de construir", body: "A energia está subindo. Um treino hoje rende de verdade. E aí, bora?" },
    { title: "💪 Pique em alta!", body: "Fase boa pra se movimentar. Escolhe algo que te anima e vai!" },
  ],
  ovulatory: [
    { title: "🔥 Você está no seu pico!", body: "É hoje que dá pra ir além. Apriveita essa energia toda e vai com tudo!" },
    { title: "⚡ Força total!", body: "Seu corpo está no auge. Que tal desafiar seus limites em um treino mais intenso?" },
    { title: "🌟 Aproveite o auge!", body: "Energia no máximo hoje. É a hora de dar aquele passo a mais. Vamos!" },
    { title: "🚀 Sem freio hoje", body: "Você está forte. Coloca tudo no treino e se supera. Dá pra ir mais longe!" },
  ],
  luteal: [
    { title: "🌾 No seu tempo", body: "A energia pode oscilar hoje. Um treino leve e constante já mantém você no ritmo." },
    { title: "🧘 Constância vale mais", body: "Não precisa ser intenso. Um movimento tranquilo hoje já é uma vitória." },
    { title: "💜 Cuide do seu ritmo", body: "Se o pique variar, tudo bem. Faz o que der, sem cobrança, e segue firme." },
    { title: "🍂 Leve e firme", body: "Fase de desacelerar um pouco. Um treino mais calmo mantém o corpo ativo sem forçar." },
  ],
};

export function pickMessage(phase: CyclePhase, lastBody?: string): NotificationMessage {
  const pool = EXERCISE_MESSAGES[phase];
  const candidates = lastBody ? pool.filter((m) => m.body !== lastBody) : pool;
  const list = candidates.length > 0 ? candidates : pool;
  return list[Math.floor(Math.random() * list.length)];
}

export type PeriodReminderKind = "approaching" | "tomorrow";

export const PERIOD_MESSAGES: Record<PeriodReminderKind, NotificationMessage[]> = {
  approaching: [
    {
      title: "🌘 Está chegando",
      body: "Sua menstruação vem aí em poucos dias. É normal a TPM aparecer agora: cansaço, inchaço, vontade de comer diferente, humor oscilando. Nada disso é frescura, é seu corpo mudando.",
    },
    {
      title: "🌸 Faltam poucos dias",
      body: "Sua menstruação está próxima. Se bater irritação ou sensibilidade nos próximos dias, é a TPM — não é você exagerando. Vá com calma e diminua o que der para diminuir.",
    },
    {
      title: "💜 Se prepare com carinho",
      body: "Sua menstruação vem aí em poucos dias. Aproveite para descansar mais, beber água e ser um pouco mais gentil consigo.",
    },
  ],
  tomorrow: [
    {
      title: "🩸 Chega amanhã",
      body: "Sua menstruação deve começar amanhã. Vale deixar o que você usa por perto hoje, para não ser pega de surpresa.",
    },
    {
      title: "📅 Amanhã é o dia previsto",
      body: "Sua menstruação está prevista para amanhã. Se puder, já separe o que precisa e planeje um dia mais leve.",
    },
    {
      title: "🌙 É amanhã",
      body: "Pela sua previsão, sua menstruação começa amanhã. Lembre de registrar aqui quando ela chegar.",
    },
  ],
};

export function pickPeriodMessage(kind: PeriodReminderKind): NotificationMessage {
  const pool = PERIOD_MESSAGES[kind];
  return pool[Math.floor(Math.random() * pool.length)];
}