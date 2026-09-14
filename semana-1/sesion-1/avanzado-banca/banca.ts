// Ejemplo avanzado (mismo stack: AI SDK + Zod) — asistente de banca "NeuronBank".
// Refuerza los conceptos del día 1 en un caso de negocio real:
//  - varias tools tipadas
//  - el loop encadenándolas
//  - un GUARDRAIL DE NEGOCIO forzado en código (el modelo no puede saltárselo)
//  - structured output para alimentar una UI o un CRM
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, generateObject, tool, stepCountIs } from "ai";
import { z } from "zod";

const model = anthropic("claude-sonnet-4-5");

// --- "Base de datos" mock del banco (en produccion: tu core bancario) ---
const CUENTAS: Record<string, { titular: string; saldo: number; limiteDiario: number }> = {
  "CU-1001": { titular: "María López", saldo: 18450, limiteDiario: 20000 },
  "CU-1002": { titular: "Jorge Díaz", saldo: 940, limiteDiario: 10000 },
};
const MOVIMIENTOS: Record<string, { fecha: string; concepto: string; monto: number }[]> = {
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

// --- Tools tipadas (solo lectura) ---
const consultarSaldo = tool({
  description: "Consulta el saldo actual de una cuenta. Solo lectura.",
  inputSchema: z.object({ cuenta: z.string().describe("Id de cuenta, ej 'CU-1001'.") }),
  execute: async ({ cuenta }) => {
    const c = CUENTAS[cuenta];
    return c ? { cuenta, titular: c.titular, saldo: c.saldo } : { error: "cuenta no encontrada" };
  },
});

const listarMovimientos = tool({
  description: "Lista los movimientos recientes de una cuenta. Solo lectura.",
  inputSchema: z.object({
    cuenta: z.string(),
    limite: z.number().int().min(1).max(20).default(5).describe("Cuantos movimientos."),
  }),
  execute: async ({ cuenta, limite }) => {
    const m = MOVIMIENTOS[cuenta] ?? [];
    return { cuenta, movimientos: m.slice(-limite) };
  },
});

// GUARDRAIL DE NEGOCIO forzado en codigo: el modelo NO autoriza ni ejecuta
// transferencias por su cuenta. Solo valida contra reglas reales del banco.
const validarTransferencia = tool({
  description:
    "Valida si una transferencia es permitida (fondos suficientes y dentro del limite diario). NO ejecuta la transferencia, solo valida.",
  inputSchema: z.object({
    cuenta: z.string(),
    monto: z.number().positive().describe("Monto a transferir."),
    destino: z.string().describe("Cuenta o beneficiario destino."),
  }),
  execute: async ({ cuenta, monto, destino }) => {
    const c = CUENTAS[cuenta];
    if (!c) return { permitido: false, motivo: "cuenta no encontrada" };
    if (monto > c.saldo) return { permitido: false, motivo: "fondos insuficientes" };
    if (monto > c.limiteDiario) return { permitido: false, motivo: `excede el limite diario (${c.limiteDiario})` };
    // Regla anti-fraude simple: montos altos y "redondos" requieren confirmacion.
    const requiereConfirmacion = monto >= 10000 && monto % 1000 === 0;
    return { permitido: true, requiereConfirmacion, destino, motivo: requiereConfirmacion ? "monto alto: confirmar con el cliente" : "ok" };
  },
});

// --- Parte 1: el agente razona y encadena tools respetando el guardrail ---
const { text, steps } = await generateText({
  model,
  system:
    "Eres el asistente de banca de NeuronBank. Usa las tools para datos reales. " +
    "NUNCA autorices ni ejecutes una transferencia por tu cuenta: usa validarTransferencia y respeta su resultado. " +
    "Se claro y prudente con el dinero del cliente.",
  tools: { consultarSaldo, listarMovimientos, validarTransferencia },
  stopWhen: stepCountIs(6),
  prompt:
    "Soy la cuenta CU-1001. ¿Cuanto tengo, cuales fueron mis ultimos movimientos, y puedo transferir 15000 a CU-1002?",
});
console.log("Pasos:", steps.length);
console.log(text);

// --- Parte 2: structured output para alimentar una UI o un CRM ---
const resumenBancario = z.object({
  titular: z.string(),
  saldo: z.number(),
  alertas: z.array(z.string()),
  accionesSugeridas: z.array(z.string()).min(1).max(4),
});

const { object } = await generateObject({
  model,
  schema: resumenBancario,
  prompt:
    "Con base en la cuenta CU-1001 (titular María López, saldo 18450, limite diario 20000) y su intencion de " +
    "transferir 15000 a CU-1002, genera un resumen bancario con alertas y acciones sugeridas.",
});
console.log(JSON.stringify(object, null, 2));
