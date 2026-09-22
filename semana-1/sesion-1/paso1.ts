import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

const model = anthropic("claude-sonnet-4-5"); // usa el Sonnet más reciente

const { text } = await generateText({
  model,
  system: "Eres un asistente",
  prompt: "¿el paquete generateText de quien es?",
});
console.log(text);
