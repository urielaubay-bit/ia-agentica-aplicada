import { z } from "zod";

// Contrato canónico del agente de NeuronBank (mismo que Semana 1 · paso4.ts).
// Un eval de schema no juzga si el texto es bueno: solo si la forma es válida.
export const reporteCuenta = z.object({
  titular: z.string(),
  cuenta: z.string(),
  saldo: z.number(), // número, no string ("18450" falla)
  alertas: z.array(z.string()).max(4),
  recomendaciones: z.array(z.object({
    accion: z.string(), motivo: z.string(), impacto: z.string(),
  })).min(1).max(4),
});
