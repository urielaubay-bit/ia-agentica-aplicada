// Baseline del proyecto del curso: el agente de NeuronBank.
// Este es el proyecto que evoluciona 5 semanas: hoy tool tipada + structured output;
// luego UI generativa (S2), MCP + guardrails (S3), Telegram + RAG (S4) y producción (S5).
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, generateObject, tool, stepCountIs } from "ai";
import { z } from "zod";

const model = anthropic("claude-sonnet-4-5");

// "Core" mock de NeuronBank (en producción: tu core bancario real).
const CUENTAS: Record<string, { titular: string; saldo: number; limiteDiario: number }> = {
  "CU-1001": { titular: "María López", saldo: 18450, limiteDiario: 20000 },
  "CU-1002": { titular: "Jorge Díaz", saldo: 940, limiteDiario: 10000 },
};

// 1) Tool tipada de solo lectura.
const consultarSaldo = tool({
  description: "Consulta el saldo actual de una cuenta de NeuronBank. Solo lectura.",
  inputSchema: z.object({ cuenta: z.string().describe("Id de cuenta, ej 'CU-1001'.") }),
  execute: async ({ cuenta }) => {
    const c = CUENTAS[cuenta];
    return c ? { cuenta, titular: c.titular, saldo: c.saldo } : { error: "cuenta no encontrada" };
  },
});

// 2) Schema de salida canónico de NeuronBank (mismo que paso4.ts / Semana 5).
const reporteCuenta = z.object({
  titular: z.string(),
  cuenta: z.string(),
  saldo: z.number(),
  alertas: z.array(z.string()).max(4),
  recomendaciones: z.array(z.object({ accion: z.string(), motivo: z.string(), impacto: z.string() })).min(1).max(4),
});

// 3) Loop: el agente usa la tool para el dato real.
const { text } = await generateText({
  model,
  system: "Eres el asistente de NeuronBank. Usa las tools para datos reales de la cuenta; nunca inventes cifras.",
  tools: { consultarSaldo },
  stopWhen: stepCountIs(5),
  prompt: "¿Cuánto tiene la cuenta CU-1001?",
});
console.log(text);

// 4) Structured output para alimentar una UI o un CRM.
const { object } = await generateObject({
  model,
  schema: reporteCuenta,
  prompt:
    "Cuenta CU-1001 (titular María López, saldo 18450, límite 20000). Genera un reporte de cuenta con alertas y recomendaciones.",
});
console.log(JSON.stringify(object, null, 2));
