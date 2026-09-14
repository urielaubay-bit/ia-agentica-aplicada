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
  prompt: "¿Cuanto es 234 * 19, y cuanto es eso mas 1000?",
});

console.log("Pasos:", steps.length);
console.log(text);
