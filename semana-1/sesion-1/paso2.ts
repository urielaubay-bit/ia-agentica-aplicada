import { tool } from "ai";
import { z } from "zod";

// "Base de datos" mock de NeuronBank (en produccion: tu core bancario).
export const CUENTAS: Record<string, { titular: string; saldo: number; limiteDiario: number }> = {
  "CU-1001": { titular: "María López", saldo: 18450, limiteDiario: 20000 },
  "CU-1002": { titular: "Jorge Díaz", saldo: 940, limiteDiario: 10000 },
};

// Una tool tipada de solo lectura: le da al modelo el dato REAL del core.
export const consultarSaldo = tool({
  description:
    "Consulta el saldo actual de una cuenta de NeuronBank. Solo lectura. Usala para cualquier dato de saldo.",
  inputSchema: z.object({
    cuenta: z.string().describe("Id de cuenta, ej 'CU-1001'."),
  }),
  execute: async ({ cuenta }) => {
    // Guardrail: solo devolvemos lo que existe; nada de inventar cuentas.
    const c = CUENTAS[cuenta];
    return c
      ? { cuenta, titular: c.titular, saldo: c.saldo }
      : { error: "cuenta no encontrada" };
  },
});
