# Princípios de UI/UX — Cycla mobile

Baseado no trabalho de Emil Kowalski (emilkowal.ski). O trabalho original é web/CSS;
aqui está traduzido para React Native + Reanimated. Seguir estas regras ao construir
ou alterar qualquer UI do app.

Princípio central: **a IA gera UI funcional, mas não sabe o que "sente certo".**
Quando houver dúvida entre duas opções, mostrar as duas para o Caio escolher e nomear
o porquê — não decidir sozinho. Refinar é o diferencial, não a funcionalidade.

## Animação

Hoje o app quase não tem animação. Toda transição, toque e entrada de conteúdo deveria
ter movimento intencional e curto.

- **Escala inicial:** começar em `scale(0.95)`, nunca `scale(0)`. Mesmo um balão murcho
  tem forma visível — partir de quase-cheio sente natural.
- **Duração:** sempre abaixo de 300ms.
  - Micro-interações (toque, toggle): 100-150ms
  - UI padrão (cards, chips): 150-250ms
  - Modais / drawers / telas: 200-300ms
- **Easing por contexto** (`react-native-reanimated`):
  - Entrar/sair da tela → `Easing.out(Easing.quad)` (ease-out)
  - Mover na tela → `Easing.inOut(Easing.quad)` (ease-in-out)
  - Movimento constante → `Easing.linear`
- **Tamanho afeta velocidade:** elementos maiores animam mais devagar. A saída pode ser
  ~20% mais rápida que a entrada.
- **Feedback de toque:** todo elemento tocável reage. Usar `Pressable` com `scale(0.97)`
  no press (via Reanimated ou `Animated`), não deixar toque sem resposta visual.
- **Stagger:** listas e grupos entram em sequência, não tudo de uma vez. Sente mais
  deliberado. Ex: `entering={FadeInDown.delay(index * 50)}`.
- **Interrupção:** abrir/fechar rápido deve responder graciosamente, sem travar a animação
  anterior.

### Equivalências web → React Native
| Web (Emil)                | React Native                                             |
| ------------------------- | ------------------------------------------------------- |
| `transition` + ease-out   | `withTiming(v, { duration, easing: Easing.out(...) })`  |
| `:active { scale(0.97) }` | `Pressable` + shared value no onPressIn/onPressOut      |
| stagger CSS               | `FadeInDown.delay(i * 50)` do Reanimated                |
| `will-change: transform`  | não necessário (Reanimated roda na UI thread)           |

## Tipografia

- Corpo de texto no máximo ~65 caracteres por linha.
- Números que alinham em coluna (datas, contadores, durações, dias do ciclo) usam
  `style={{ fontVariant: ["tabular-nums"] }}`.
- Reticências: caractere Unicode `…`, nunca três pontos `...`.
- Sublinhado só para links. Nunca para ênfase.
- Ênfase com **negrito**, nunca itálico.

## TextInput (regra específica do projeto)

Nunca usar `text-sm` (ou qualquer `text-*` que injete `lineHeight`) direto em `TextInput`.
No iOS quebra a centralização vertical do texto. Definir `fontSize` via `style` e usar
`height` fixo + `paddingHorizontal`. Ver histórico em memória.

## Método de trabalho (o "porquê" acima do "o quê")

- Ao avaliar UI, ir além de "bom/ruim": nomear a decisão específica que cria o efeito.
- Documentar o porquê de cada escolha de design com especificidade e rigor.
- Trabalho inicial vai ficar aquém — isso é sinal de que o taste está se desenvolvendo,
  não de fracasso. Iterar.
