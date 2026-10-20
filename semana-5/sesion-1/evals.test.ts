import "dotenv/config"; // el lab tambien funciona con la variable exportada (SETUP.md)
import { describe, it, expect } from "vitest";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { reporteCuenta } from "./schemas.ts";

// ── 1) Validez de schema (determinista, sin API) ────────────────────────────
// Cubre el contrato de reporteCuenta: si el structured output se rompe,
// estos tests fallan antes de gastar tokens.
describe("validez de schema", () => {
  const recomendacionOk = {
    accion: "Revisar cargo",
    motivo: "posible fraude",
    impacto: "protege al cliente",
  };

  it("acepta una salida valida", () => {
    const salida = {
      titular: "María López",
      cuenta: "CU-1001",
      saldo: 18450,
      alertas: ["cargo por revisar"],
      recomendaciones: [recomendacionOk],
    };
    expect(reporteCuenta.safeParse(salida).success).toBe(true);
  });

  it("rechaza una salida invalida", () => {
    // Falta titular/cuenta/alertas/recomendaciones y saldo no es number.
    expect(reporteCuenta.safeParse({ saldo: "mucho" }).success).toBe(false);
  });

  it("rechaza más de 4 alertas", () => {
    expect(reporteCuenta.safeParse({
      titular: "María López",
      cuenta: "CU-1001",
      saldo: 18450,
      alertas: ["a", "b", "c", "d", "e"],
      recomendaciones: [recomendacionOk],
    }).success).toBe(false);
  });

  it("rechaza recomendaciones vacías", () => {
    expect(reporteCuenta.safeParse({
      titular: "María López",
      cuenta: "CU-1001",
      saldo: 18450,
      alertas: [],
      recomendaciones: [],
    }).success).toBe(false);
  });
});

// ── 2) Groundedness (determinista) ──────────────────────────────────────────
// Comprueba que la respuesta contiene un hecho de la KB, no que el estilo
// sea elegante. Reemplaza miAgente por tu función real de NeuronBank.
async function miAgente(pregunta: string): Promise<string> {
  const kb: Record<string, string> = {
    spei: "Las transferencias SPEI son gratuitas hasta 100,000 por operacion.",
    fraude: "Para reportar un cargo no reconocido, usa la app o llama al 800-NEURON las 24 horas.",
    "saldo-cu-1001": "El saldo de CU-1001 es 18450.",
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

  it("no inventa cuando no hay fuente", async () => {
    const r = await miAgente("saldo-cu-9999");
    expect(r).toContain("No tengo esa informacion");
  });

  // Scoping (gancho a Semana 3): CU-1001 si, CU-1002 no. El schema no impide
  // ver otra cuenta; eso se prueba aqui, no en Zod.
  it("responde por la cuenta propia", async () => {
    expect(await miAgente("saldo-cu-1001")).toContain("18450");
  });

  it("no revela otra cuenta", async () => {
    expect(await miAgente("saldo-cu-1002")).toContain("No tengo esa informacion");
  });
});

// ── 3) LLM-as-judge (barato; se salta sin ANTHROPIC_API_KEY) ────────────────
// Un modelo pequeño califica 1–5. No sustituye schema ni groundedness:
// cubre utilidad y fidelidad cuando el substring check no alcanza.
// `npm test` sigue pasando sin clave: este bloque se omite.
const veredictoJuez = z.object({
  puntaje: z.number().int().min(1).max(5),
  razon: z.string(),
});

const tieneClave = Boolean(process.env.ANTHROPIC_API_KEY);

describe.skipIf(!tieneClave)("llm-as-judge", () => {
  it("califica >= 4 una respuesta anclada a la KB", { retry: 2 }, async () => {
    const pregunta = "¿Las transferencias SPEI tienen comisión?";
    const respuesta = await miAgente("spei");
    const fuente = "Las transferencias SPEI son gratuitas hasta 100,000 por operacion.";

    const { object } = await generateObject({
      model: anthropic(process.env.JUDGE_MODEL ?? "claude-haiku-4-5"),
      temperature: 0, // primer remedio contra flakiness, antes de tocar el umbral
      schema: veredictoJuez,
      prompt:
        "Eres un juez de evals de NeuronBank. Califica de 1 a 5.\n" +
        "5 = fiel a la fuente, útil y sin inventar. 1 = contradice o alucina.\n" +
        `Fuente:\n${fuente}\nPregunta:\n${pregunta}\nRespuesta:\n${respuesta}\n` +
        "Devuelve puntaje (entero 1-5) y razon breve.",
    });

    console.log(`juez -> ${object.puntaje}/5: ${object.razon}`); // la razon ensena mas que el numero
    expect(object.puntaje).toBeGreaterThanOrEqual(4);
  });
});
