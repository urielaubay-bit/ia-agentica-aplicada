import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool, stepCountIs, convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";

export const maxDuration = 30;

const getKpiSummary = tool({
  description:
    "Trae los KPIs (revenue, sessions, conversions, conversion rate, AOV) para un canal y rango. Renderiza tarjetas de KPI.",
  inputSchema: z.object({
    channel: z.string().optional().describe("Canal, ej 'email'. Omite para todos."),
    range: z.string().optional().describe("Rango, ej 'last_30_days'."),
  }),
  execute: async ({ channel = "all", range = "last_30_days" }) => ({
    channel, range,
    kpis: [
      { label: "Revenue", value: "$461,475", delta: "+14%" },
      { label: "Sessions", value: "196,547", delta: "+8%" },
      { label: "Conversions", value: "5,458", delta: "+11%" },
      { label: "Conv. rate", value: "2.78%", delta: "+0.3pp" },
    ],
  }),
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: anthropic("claude-sonnet-4-5"),
    system:
      "Eres un copiloto de analitica. Cuando el usuario pida metricas, usa getKpiSummary. Interpreta los numeros brevemente en texto.",
    messages: convertToModelMessages(messages),
    tools: { getKpiSummary },
    stopWhen: stepCountIs(5),
  });
  return result.toUIMessageStreamResponse();
}
