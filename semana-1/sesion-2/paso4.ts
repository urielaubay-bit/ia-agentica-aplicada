import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

// Schema canonico de NeuronBank: la MISMA forma que renderizas como UI en la Semana 2
// y que evaluas con evals en la Semana 5.
const recomendacion = z.object({
  accion: z.string().describe("Accion concreta y especifica."),
  motivo: z.string().describe("Por que, fundamentado en los datos de la cuenta."),
  impacto: z.string().describe("Impacto esperado para el cliente o el banco."),
});

export const reporteCuenta = z.object({
  titular: z.string().describe("Nombre del titular."),
  cuenta: z.string().describe("Id de cuenta, ej 'CU-1001'."),
  saldo: z.number().describe("Saldo actual."),
  alertas: z.array(z.string()).max(4).describe("Riesgos o señales (fraude, saldo bajo, etc.)."),
  recomendaciones: z.array(recomendacion).min(1).max(4),
});

const { object } = await generateObject({
  model: anthropic("claude-sonnet-4-5"),
  schema: reporteCuenta,
  prompt:
    "Cuenta CU-1001 (titular María López, saldo 18450, límite diario 20000). Movimientos recientes: " +
    "nómina +15000, pago tarjeta -3200, súper -850. Genera un reporte de cuenta con alertas y recomendaciones.",
});

console.log(JSON.stringify(object, null, 2));
