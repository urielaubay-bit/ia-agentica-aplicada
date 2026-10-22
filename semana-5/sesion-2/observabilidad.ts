import "dotenv/config";
import { anthropic } from "@ai-sdk/anthropic";
import * as ai from "ai";
import { wrapAISDK } from "langsmith/experimental/vercel";
import { costoUsd, mxn, usd } from "./web/app/lib/precios";

// PASO 1 de la sesion. Una llamada, cuatro numeros: latencia, tokens, cache y
// costo. Si no puedes decir estos cuatro de tu agente, no esta listo para
// produccion, por bonito que se vea el demo.
//
// Correr:  npx tsx observabilidad.ts
// Con LangSmith:  LANGSMITH_TRACING=true LANGSMITH_API_KEY=lsv2_... npx tsx observabilidad.ts

const LANGSMITH =
  process.env.LANGSMITH_TRACING === "true" && !!process.env.LANGSMITH_API_KEY;

// Una linea y cada llamada queda en LangSmith. Sin clave, el SDK va sin
// envolver y el script corre igual: la medicion local nunca depende de un
// servicio externo.
const { generateText } = LANGSMITH ? wrapAISDK(ai) : ai;

const MODELO = process.env.MODELO ?? "claude-sonnet-5-5";

const t0 = Date.now();
const { text, usage, providerMetadata } = await generateText({
  model: anthropic(MODELO),
  system: "Eres el asistente conciso de NeuronBank.",
  prompt: "Explica en una frase que es una transferencia SPEI.",
});
const ms = Date.now() - t0;

const tokens = {
  entrada: usage.inputTokens ?? 0,
  salida: usage.outputTokens ?? 0,
  cacheLeido: usage.cachedInputTokens ?? 0,
  cacheEscrito: (providerMetadata?.anthropic?.cacheCreationInputTokens as number | null) ?? 0,
};
const costo = costoUsd(MODELO, tokens);

console.log("respuesta:    ", text);
console.log("modelo:       ", MODELO);
console.log("latencia_ms:  ", ms);
console.log("tokens:       ", tokens);
console.log("costo:        ", `${usd(costo)} USD  (${mxn(costo)} MXN)`);
console.log("por 1,000:    ", `${usd(costo * 1000)} USD  (${mxn(costo * 1000)} MXN)`);
console.log("langsmith:    ", LANGSMITH ? "si, revisa tu proyecto en smith.langchain.com" : "apagado");

// Fijate en que cacheLeido y cacheEscrito salen en CERO: el system de este
// script tiene 10 tokens y el minimo cacheable del modelo son 512. El cache no
// falla, simplemente no aplica, y no hay ningun error que te avise.
// Ese es el tema de costo.ts.
