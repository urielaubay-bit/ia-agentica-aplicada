import "dotenv/config";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { POLITICAS } from "./web/app/lib/politicas";
import { PRECIOS, costoUsd, costoUsdSinCache, usd } from "./web/app/lib/precios";

// PASO 2 de la sesion: las dos palancas de costo, medidas en vivo.
//
//   A. PROMPT CACHING del prefijo estable.
//   B. DOS NIVELES DE MODELO (caro para razonar, barato para volumen).
//
// Y la trampa que se lleva el ahorro sin avisar: un prefijo que cambia.
//
// Correr:  npx tsx costo.ts

const CARO = process.env.MODELO_RAZONA ?? "claude-sonnet-5-5";
const BARATO = process.env.MODELO_VOLUMEN ?? "claude-haiku-5-5";
const PREGUNTA = "Cuanto cuesta una transferencia SPEI y cual es el limite por operacion sin token?";

type Medicion = { etiqueta: string; ms: number; cacheLeido: number; cacheEscrito: number; costo: number; sinCache: number };

async function llamar(
  etiqueta: string,
  modelo: string,
  prefijo: string,
  cachear: boolean,
): Promise<Medicion> {
  const t0 = Date.now();
  const { usage, providerMetadata } = await generateText({
    model: anthropic(modelo),
    // El system va como MENSAJE para poder marcarlo cacheable; como string
    // plano no hay donde colgar el cache_control.
    messages: [
      {
        role: "system",
        content: prefijo,
        ...(cachear
          ? { providerOptions: { anthropic: { cacheControl: { type: "ephemeral" as const } } } }
          : {}),
      },
      { role: "user", content: PREGUNTA },
    ],
    allowSystemInMessages: true,
  });
  const tokens = {
    entrada: usage.inputTokens ?? 0,
    salida: usage.outputTokens ?? 0,
    cacheLeido: usage.cachedInputTokens ?? 0,
    cacheEscrito: (providerMetadata?.anthropic?.cacheCreationInputTokens as number | null) ?? 0,
  };
  return {
    etiqueta,
    ms: Date.now() - t0,
    cacheLeido: tokens.cacheLeido,
    cacheEscrito: tokens.cacheEscrito,
    costo: costoUsd(modelo, tokens),
    sinCache: costoUsdSinCache(modelo, tokens),
  };
}

function fila(m: Medicion) {
  console.log(
    `  ${m.etiqueta.padEnd(38)} ${String(m.ms).padStart(5)} ms   cache r/w ${String(m.cacheLeido).padStart(5)}/${String(m.cacheEscrito).padStart(5)}   ${usd(m.costo)}`,
  );
}

console.log(`\nPrefijo estable: ${POLITICAS.length} caracteres (~2,700 tokens). Minimo cacheable del modelo: 512.\n`);

// --- A) El cache, tres llamadas identicas --------------------------------
console.log(`A) Prompt caching · ${CARO}`);
const a1 = await llamar("llamada 1 (en frio escribe el cache)", CARO, POLITICAS, true);
const a2 = await llamar("llamada 2", CARO, POLITICAS, true);
const a3 = await llamar("llamada 3", CARO, POLITICAS, true);
[a1, a2, a3].forEach(fila);
if (a1.cacheEscrito > 0) {
  console.log(
    `  -> la 1a escribio el cache y costo ${(a1.costo / a2.costo).toFixed(1)}x la 2a: el cache se paga solo desde el segundo turno.`,
  );
} else {
  // El TTL del cache es de 5 minutos y una lectura lo renueva: si corriste el
  // script hace poco, la 1a llamada YA encuentra el prefijo caliente y no hay
  // escritura que ver. Espera 5 minutos para repetir el arranque en frio.
  console.log("  -> la 1a ya encontro el cache caliente de una corrida anterior (TTL 5 min).");
  console.log("     Para ver el arranque en frio, espera 5 minutos y vuelve a correr.");
}
const conCache = a1.costo + a2.costo + a3.costo;
const sinCache = a1.sinCache + a2.sinCache + a3.sinCache;
console.log(
  `  -> las tres llamadas: ${usd(conCache)} con cache vs ${usd(sinCache)} sin cache (${Math.round((1 - conCache / sinCache) * 100)}% menos).\n`,
);

// --- B) La trampa: el prefijo que cambia ---------------------------------
// Un solo caracter distinto y el cache no aplica. No hay error, no hay aviso:
// solo la factura. Esto es lo que mata el ahorro en produccion.
console.log("B) El invalidador silencioso (una fecha dentro del prefijo)");
const b1 = await llamar("con timestamp, llamada 1", CARO, `${POLITICAS}\n\nGenerado: ${new Date().toISOString()}`, true);
const b2 = await llamar("con timestamp, llamada 2", CARO, `${POLITICAS}\n\nGenerado: ${new Date().toISOString()}`, true);
[b1, b2].forEach(fila);
console.log("  -> cache leido = 0 en las dos: cada llamada ESCRIBE de nuevo y ninguna lee.");
console.log(
  `  -> peor que no cachear: la escritura cuesta 1.25x, asi que pagas ${(b2.costo / a2.costo).toFixed(1)}x lo de un turno caliente.`,
);
console.log("  -> reloj, id de sesion o nombre de usuario en el prefijo = cero ahorro, y sin un solo error.\n");

// --- C) Dos niveles de modelo -------------------------------------------
console.log("C) Dos niveles de modelo · misma pregunta, mismo prefijo cacheado");
const c1 = await llamar(`caro   (${CARO})`, CARO, POLITICAS, true);
const c2 = await llamar(`barato (${BARATO})`, BARATO, POLITICAS, true);
const c3 = await llamar(`barato (${BARATO}) en caliente`, BARATO, POLITICAS, true);
[c1, c2, c3].forEach(fila);
console.log(
  `  -> entrada: ${usd(PRECIOS[CARO].entrada)}/MTok vs ${usd(PRECIOS[BARATO].entrada)}/MTok. En caliente el barato cuesta ${(c1.costo / c3.costo).toFixed(0)}x menos.`,
);
console.log(
  "  -> la pregunta: cuantas de tus consultas de verdad necesitan al caro. Esa fraccion es tu factura.\n",
);
