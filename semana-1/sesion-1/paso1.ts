import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

const model = anthropic("claude-sonnet-4-5"); // usa el Sonnet mas reciente

// Le preguntamos por un dato EXACTO del core de NeuronBank que el modelo no tiene.
const { text } = await generateText({
  model,
  system: "Eres el asistente de NeuronBank. Responde conciso y directo.",
  prompt: "¿Cual es el saldo exacto de la cuenta CU-1001?",
});
console.log(text);

// El modelo no tiene acceso al core bancario: o se niega, o inventa.
// Ese es el problema que resuelven las tools (darle datos reales).
