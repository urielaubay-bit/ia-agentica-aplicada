import { anthropic } from "@ai-sdk/anthropic";
import { generateText, stepCountIs } from "ai";
import { calculadora } from "./paso2.ts";

const model = anthropic("claude-sonnet-4-5");

const { text, steps } = await generateText({
  model,
  system:
    "Eres un asistente que resuelve problemas numericos. Usa la tool 'calculadora' para cualquier calculo exacto. Nunca inventes resultados.",
  tools: { calculadora },
  stopWhen: stepCountIs(5),
  prompt: "¿Cuanto es 100 por 1000 MXN, y cuanto es eso mas 500,000 MXN y a eso restale 200,000 MXN? pasalo a dolares, puedes buscar el tipo de cambio en google",
});

console.log("Pasos:", steps.length);
console.log(text);
