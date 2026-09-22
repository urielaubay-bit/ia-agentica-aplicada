import { z } from "zod";

// Schema canónico del agente de NeuronBank (mismo que Semana 1 · paso4.ts).
export const reporteCuenta = z.object({
  titular: z.string(),
  cuenta: z.string(),
  saldo: z.number(),
  alertas: z.array(z.string()).max(4),
  recomendaciones: z.array(z.object({
    accion: z.string(), motivo: z.string(), impacto: z.string(),
  })).min(1).max(4),
});
