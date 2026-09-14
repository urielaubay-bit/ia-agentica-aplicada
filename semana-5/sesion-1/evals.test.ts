import { describe, it, expect } from "vitest";
import { executiveReport } from "./schemas.ts";

// 1) Validez de schema (determinista, sin API)
describe("validez de schema", () => {
  it("acepta una salida valida", () => {
    const salida = {
      headline: "Ventas +14%",
      summary: "Buen mes.",
      highlights: ["revenue 461,475"],
      risks: [],
      recommendedActions: [{ action: "Escalar email", rationale: "mejor ROI", expectedImpact: "+ingresos" }],
    };
    expect(executiveReport.safeParse(salida).success).toBe(true);
  });
  it("rechaza una salida invalida", () => {
    expect(executiveReport.safeParse({ headline: 123 }).success).toBe(false);
  });
});

// 2) Groundedness (determinista) — reemplaza miAgente por tu funcion real
async function miAgente(pregunta: string): Promise<string> {
  const kb: Record<string, string> = {
    horario: "Atendemos de 9 a 18 h.",
    devoluciones: "Aceptamos devoluciones hasta 30 dias con ticket.",
  };
  return kb[pregunta] ?? "No tengo esa informacion.";
}

describe("groundedness", () => {
  const casos = [
    { pregunta: "horario", debeContener: "9 a 18" },
    { pregunta: "devoluciones", debeContener: "30 dias" },
  ];
  for (const c of casos) {
    it(`responde con la fuente: ${c.pregunta}`, async () => {
      const r = await miAgente(c.pregunta);
      expect(r).toContain(c.debeContener);
    });
  }
});
