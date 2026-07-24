export type TaskCategory = "exercise" | "study" | "rest" | "social" | "creative";

export type TaskSuggestion = {
  text: string;
  category: TaskCategory;
  duration: number;
};

export const TASK_SUGGESTIONS: Record<string, TaskSuggestion[]> = {
  menstrual: [
    { text: "Fazer yoga restaurativa", category: "exercise", duration: 30 },
    { text: "Ler um livro por 20 minutos", category: "rest", duration: 20 },
    { text: "Revisar anotações antigas", category: "study", duration: 25 },
    { text: "Meditação guiada", category: "rest", duration: 15 },
    { text: "Alongamento leve", category: "exercise", duration: 20 },
  ],
  follicular: [
    { text: "Aprender algo novo", category: "study", duration: 45 },
    { text: "Treino de força", category: "exercise", duration: 50 },
    { text: "Iniciar um projeto criativo", category: "creative", duration: 40 },
    { text: "Planejar a semana", category: "study", duration: 20 },
    { text: "Sair com amigas", category: "social", duration: 120 },
  ],
  ovulatory: [
    { text: "Treino intenso (HIIT)", category: "exercise", duration: 45 },
    { text: "Fazer uma apresentação", category: "social", duration: 60 },
    { text: "Propor uma ideia nova", category: "creative", duration: 30 },
    { text: "Atividade em grupo", category: "social", duration: 90 },
    { text: "Desafio de leitura rápida", category: "study", duration: 30 },
  ],
  luteal: [
    { text: "Organizar espaço de trabalho", category: "rest", duration: 30 },
    { text: "Revisão e organização de arquivos", category: "study", duration: 35 },
    { text: "Caminhada leve ao ar livre", category: "exercise", duration: 30 },
    { text: "Escrever no diário", category: "creative", duration: 20 },
    { text: "Treino moderado", category: "exercise", duration: 40 },
  ],
};
