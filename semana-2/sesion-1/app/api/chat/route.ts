import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool, stepCountIs, convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";

export const maxDuration = 30;

// Tool de NeuronBank: trae los KPIs de una cuenta y se renderiza como tarjetas.
const getKpisCuenta = tool({
  description:
    "Trae los KPIs de una cuenta de NeuronBank (saldo, movimientos del mes, alertas de fraude, limite disponible). Renderiza tarjetas.",
  inputSchema: z.object({
    cuenta: z.string().optional().describe("Id de cuenta, ej 'CU-1001'. Omite para la principal."),
    mes: z.string().optional().describe("Mes, ej '2026-09'."),
  }),
  execute: async ({ cuenta = "CU-1001", mes = "2026-09" }) => ({
    cuenta, mes,
    kpis: [
      { label: "Saldo", value: "$18,450", delta: "al corte de hoy" },
      { label: "Movimientos (mes)", value: "12", delta: "3 salientes" },
      { label: "Alertas de fraude", value: "1", delta: "cargo por revisar" },
      { label: "Límite disponible", value: "$20,000", delta: "diario" },
    ],
  }),
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: anthropic("claude-sonnet-4-5"),
    system:
      "Eres el copiloto de NeuronBank. Cuando el usuario pida datos de una cuenta, usa getKpisCuenta. Interpreta los numeros brevemente en texto.",
    messages: convertToModelMessages(messages),
    tools: { getKpisCuenta },
    stopWhen: stepCountIs(5),
  });
  return result.toUIMessageStreamResponse();
}
