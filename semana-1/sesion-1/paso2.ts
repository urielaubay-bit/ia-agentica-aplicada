import { tool } from "ai";
import { z } from "zod";

export const calculadora = tool({
  description:
    "Evalua una operacion aritmetica simple y devuelve el resultado exacto.",
  inputSchema: z.object({
    expresion: z.string().describe("Operacion aritmetica, ej '234 * 19'."),
  }),
  execute: async ({ expresion }) => {
    // Guardrail: NUNCA uses eval con entrada libre. Validamos operaciones.
    if (!/^[\d\s+\-*/().]+$/.test(expresion)) return "Error: expresion no permitida.";
    const r = Function(`"use strict"; return (${expresion})`)();
    return String(r);
  },
});
