import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

const recommendedAction = z.object({
  action: z.string().describe("Accion concreta y especifica."),
  rationale: z.string().describe("Por que, fundamentado en los datos."),
  expectedImpact: z.string().describe("Impacto de negocio esperado."),
});

export const executiveReport = z.object({
  headline: z.string().describe("Resultado en una linea."),
  summary: z.string().describe("Resumen ejecutivo de 2-3 frases."),
  highlights: z.array(z.string()).min(1).max(5),
  risks: z.array(z.string()).max(4),
  recommendedActions: z.array(recommendedAction).min(1).max(4),
});

const { object } = await generateObject({
  model: anthropic("claude-sonnet-4-5"),
  schema: executiveReport,
  prompt:
    "Ventas del mes: revenue 461,475 (+14% vs mes previo), conversion 2.78%. Genera un reporte ejecutivo.",
});

console.log(JSON.stringify(object, null, 2));
