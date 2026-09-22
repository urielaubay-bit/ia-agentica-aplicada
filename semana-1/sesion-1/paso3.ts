import { anthropic } from "@ai-sdk/anthropic";
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { consultarSaldo, CUENTAS } from "./paso2.ts";

const model = anthropic("claude-sonnet-4-5");

// Segunda tool (solo lectura) para que el modelo ENCADENE llamadas en el loop.
const listarMovimientos = tool({
  description: "Lista los ultimos movimientos de una cuenta de NeuronBank. Solo lectura.",
  inputSchema: z.object({
    cuenta: z.string().describe("Id de cuenta, ej 'CU-1001'."),
    limite: z.number().int().min(1).max(10).default(3).describe("Cuantos movimientos."),
  }),
  execute: async ({ cuenta, limite }) => {
    const MOVS: Record<string, { fecha: string; concepto: string; monto: number }[]> = {
      "CU-1001": [
        { fecha: "2026-09-10", concepto: "Deposito nomina", monto: 15000 },
        { fecha: "2026-09-11", concepto: "Pago tarjeta", monto: -3200 },
        { fecha: "2026-09-12", concepto: "Super", monto: -850 },
      ],
      "CU-1002": [
        { fecha: "2026-09-09", concepto: "Transferencia recibida", monto: 500 },
        { fecha: "2026-09-12", concepto: "Retiro cajero", monto: -1200 },
      ],
    };
    return { cuenta, movimientos: (MOVS[cuenta] ?? []).slice(-limite) };
  },
});

const { text, steps } = await generateText({
  model,
  system:
    "Eres el asistente de NeuronBank. Usa las tools para cualquier dato de una cuenta. " +
    "Nunca inventes saldos ni movimientos: si no hay dato, dilo.",
  tools: { consultarSaldo, listarMovimientos },
  stopWhen: stepCountIs(5), // el SDK corre el loop hasta 5 pasos
  prompt:
    "Para la cuenta CU-1001: ¿cual es su saldo y cuales fueron sus ultimos 2 movimientos?",
});

console.log("Cuentas de demo:", Object.keys(CUENTAS).join(", "));
console.log("Pasos:", steps.length);
console.log(text);
