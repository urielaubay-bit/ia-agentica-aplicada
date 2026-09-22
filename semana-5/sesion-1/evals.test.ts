import { describe, it, expect } from "vitest";
import { reporteCuenta } from "./schemas.ts";

// 1) Validez de schema (determinista, sin API)
describe("validez de schema", () => {
  it("acepta una salida valida", () => {
    const salida = {
      titular: "María López",
      cuenta: "CU-1001",
      saldo: 18450,
      alertas: ["cargo por revisar"],
      recomendaciones: [{ accion: "Revisar cargo", motivo: "posible fraude", impacto: "protege al cliente" }],
    };
    expect(reporteCuenta.safeParse(salida).success).toBe(true);
  });
  it("rechaza una salida invalida", () => {
    expect(reporteCuenta.safeParse({ saldo: "mucho" }).success).toBe(false);
  });
});

// 2) Groundedness (determinista) — reemplaza miAgente por tu funcion real de NeuronBank
async function miAgente(pregunta: string): Promise<string> {
  const kb: Record<string, string> = {
    spei: "Las transferencias SPEI son gratuitas hasta 100,000 por operacion.",
    fraude: "Para reportar un cargo no reconocido, usa la app o llama al 800-NEURON las 24 horas.",
  };
  return kb[pregunta] ?? "No tengo esa informacion.";
}

describe("groundedness", () => {
  const casos = [
    { pregunta: "spei", debeContener: "gratuitas" },
    { pregunta: "fraude", debeContener: "800-NEURON" },
  ];
  for (const c of casos) {
    it(`responde con la fuente: ${c.pregunta}`, async () => {
      const r = await miAgente(c.pregunta);
      expect(r).toContain(c.debeContener);
    });
  }
});
