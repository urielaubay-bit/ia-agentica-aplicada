import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

// Observabilidad basica: imprime tokens (incl. cache) y latencia por llamada.
const t0 = Date.now();
const { text, usage } = await generateText({
  model: anthropic("claude-sonnet-4-5"),
  system: "Eres un asistente conciso.",
  prompt: "Explica en una frase que es prompt caching.",
});
const ms = Date.now() - t0;

console.log("respuesta:", text);
console.log("latencia_ms:", ms);
console.log("tokens:", usage); // input/output (y cache si tu version lo expone)
// Dos palancas de costo: (1) prompt caching del prefijo estable (system + tools),
// (2) dos niveles de modelo (capaz para razonar, barato para volumen).
