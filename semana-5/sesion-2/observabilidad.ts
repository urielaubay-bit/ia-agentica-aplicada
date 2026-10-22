import "dotenv/config";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { costoUsd, mxn, usd } from "./web/app/lib/precios";

// PASO 1 de la sesion. Una llamada, cuatro numeros: latencia, tokens, cache y
// costo. Si no puedes decir estos cuatro de tu agente, no esta listo para
// produccion, por bonito que se vea el demo.
//
// Correr:  npx tsx observabilidad.ts
//
// Esta es la capa de observabilidad que SIEMPRE tienes: la tuya. No necesita
// cuenta, servicio ni red mas que la del modelo. La capa del proveedor
// (Langfuse) se ve en la app web, en web/.

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
console.log("trazas:       ", "locales (la capa del proveedor se ve en web/, con Langfuse)");

// Fijate en que cacheLeido y cacheEscrito salen en CERO: el system de este
// script tiene 10 tokens y el minimo cacheable del modelo son 512. El cache no
// falla, simplemente no aplica, y no hay ningun error que te avise.
// Ese es el tema de costo.ts.
