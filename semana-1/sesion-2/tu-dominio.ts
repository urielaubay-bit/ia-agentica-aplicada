// Plantilla: convierte el ejemplo en TU dominio.
// 1) Define una tool tipada de tu dominio. 2) Define tu schema de salida.
// 3) Corre el loop con tu tool y genera tu structured output.
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, generateObject, tool, stepCountIs } from "ai";
import { z } from "zod";

const model = anthropic("claude-sonnet-4-5");

// TODO: reemplaza por la tool de tu dominio.
const miTool = tool({
  description: "TODO: describe que hace tu tool y cuando usarla.",
  inputSchema: z.object({ consulta: z.string().describe("TODO") }),
  execute: async ({ consulta }) => {
    return `resultado para: ${consulta}`;
  },
});

// TODO: reemplaza por el schema de salida de tu dominio.
const miSchema = z.object({
  titulo: z.string(),
  puntos: z.array(z.string()).min(1).max(5),
});

const { text } = await generateText({
  model,
  system: "Eres el asistente de mi dominio. Usa la tool cuando aplique.",
  tools: { miTool },
  stopWhen: stepCountIs(5),
  prompt: "TODO: una pregunta de tu dominio.",
});
console.log(text);

const { object } = await generateObject({ model, schema: miSchema, prompt: "TODO" });
console.log(JSON.stringify(object, null, 2));
