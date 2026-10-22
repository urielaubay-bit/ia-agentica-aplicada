import { anthropic } from "@ai-sdk/anthropic";
import * as ai from "ai";
import { wrapAISDK } from "langsmith/experimental/vercel";
import { stepCountIs, tool, convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";
import { POLITICAS } from "../../lib/politicas";
import { agregarLlamada, cerrarTraza, nuevaTraza } from "../../lib/trazas";
import {
  getCuenta,
  kpisDeCuenta,
  movimientosSospechosos,
  reporteDeCuenta,
  validarTransferencia,
} from "./cuentas";

export const maxDuration = 60;

// ===========================================================================
// SEMANA 5 · SESION 2 · El mismo copiloto de Semana 2, listo para produccion.
//
// Tres cosas se agregan aqui y solo tres. Las tools son las mismas.
//
//   1. OBSERVABILIDAD. Cada turno queda registrado con sus llamadas al
//      modelo, tokens, latencia y costo (lib/trazas.ts -> panel de la UI), y
//      opcionalmente se manda a LangSmith.
//   2. COSTO. Dos palancas: prompt caching del prefijo estable y dos niveles
//      de modelo con un router barato que decide cual usar.
//   3. FALLO VISIBLE. Si algo truena, la traza lo guarda. Un fallo que no se
//      registra no existe, y lo que no existe no se arregla.
// ===========================================================================

// --- 1) LangSmith -----------------------------------------------------------
// wrapAISDK envuelve las funciones del AI SDK y manda cada llamada (y cada
// tool) a LangSmith. Si no hay clave, usamos el SDK sin envolver: la app corre
// igual y el panel de abajo sigue funcionando. La observabilidad propia nunca
// depende de un servicio externo.
const LANGSMITH =
  process.env.LANGSMITH_TRACING === "true" && !!process.env.LANGSMITH_API_KEY;

// Ojo: streamText envuelto devuelve una PROMESA, el sin envolver no. Con
// `await` las dos formas funcionan y el resto del archivo no cambia.
const { streamText, generateObject } = LANGSMITH ? wrapAISDK(ai) : ai;

// --- 2) Dos niveles de modelo ----------------------------------------------
// El caro razona, el barato atiende volumen. Se configuran por entorno para
// poder cambiarlos en vivo y ver el costo moverse en el panel.
// Ojo con el MINIMO CACHEABLE del modelo: por debajo de el, el prefijo no se
// cachea y no hay error, solo cache_read = 0. Medido el 2026-10-22 con este
// mismo prefijo (~4,070 tokens): Sonnet 4.5 cachea (minimo 1,024) y Haiku 4.5
// NO (minimo 4,096). Los modelos 5.5 tienen minimo 512 y cachean los dos, por
// eso son el default aqui.
const MODELO_RAZONA = process.env.MODELO_RAZONA ?? "claude-sonnet-5-5";
const MODELO_VOLUMEN = process.env.MODELO_VOLUMEN ?? "claude-haiku-5-5";
const ROUTER = process.env.ROUTER !== "off";

// --- Prefijo estable (lo que se cachea) ------------------------------------
// tools -> system -> messages es el orden de render. Las tools son fijas y el
// system es este texto, byte-estable: por eso el prefijo se puede cachear.
// Nada variable entra aqui.
const SISTEMA = `${POLITICAS}

INSTRUCCIONES DE HERRAMIENTAS
Elige la tool segun lo que pida el usuario: KPIs (getKpisCuenta), movimientos
(listarMovimientos), revision de fraude (revisarFraude), reporte ejecutivo
(generarReporte) o enfocar el dashboard (enfocarDashboard). Para graficas del
portafolio usa visualiza y ELIGE el tipo (burbujas, dona o barras) segun la
pregunta; se dibuja en el panel 'Vision general'. Para transferencias usa
simularTransferencia: SOLO validas, NUNCA ejecutas.`;

const cuentaArg = z.object({
  cuenta: z.string().optional().describe("Id de cuenta, ej 'CU-1001'. Omite para la principal."),
});

const getKpisCuenta = tool({
  description:
    "KPIs de una cuenta de NeuronBank (saldo, movimientos del mes, alertas de fraude, limite). Renderiza tarjetas.",
  inputSchema: cuentaArg,
  execute: async ({ cuenta = "CU-1001" }) => {
    const c = getCuenta(cuenta);
    if (!c) return { error: `Cuenta ${cuenta} no encontrada` };
    return { cuenta, titular: c.titular, kpis: kpisDeCuenta(c) };
  },
});

const listarMovimientos = tool({
  description:
    "Lista los movimientos del mes de una cuenta. Renderiza una tabla con mini grafica de saldo.",
  inputSchema: cuentaArg,
  execute: async ({ cuenta = "CU-1001" }) => {
    const c = getCuenta(cuenta);
    if (!c) return { error: `Cuenta ${cuenta} no encontrada` };
    return { cuenta, titular: c.titular, saldoFinal: c.saldo, movimientos: c.movimientos };
  },
});

const revisarFraude = tool({
  description:
    "Revisa una cuenta en busca de cargos sospechosos o para revision manual. Renderiza una tarjeta de fraude.",
  inputSchema: cuentaArg,
  execute: async ({ cuenta = "CU-1001" }) => {
    const c = getCuenta(cuenta);
    if (!c) return { error: `Cuenta ${cuenta} no encontrada` };
    return { cuenta, titular: c.titular, sospechosos: movimientosSospechosos(c) };
  },
});

const generarReporte = tool({
  description:
    "Genera un reporte ejecutivo de la cuenta (resumen, aciertos, riesgos, recomendaciones). Renderiza una tarjeta de reporte.",
  inputSchema: cuentaArg,
  execute: async ({ cuenta = "CU-1001" }) => {
    const c = getCuenta(cuenta);
    if (!c) return { error: `Cuenta ${cuenta} no encontrada` };
    return { cuenta, reporte: reporteDeCuenta(cuenta, c) };
  },
});

const enfocarDashboard = tool({
  description:
    "Cambia el panel 'Vision general' (dashboard de la izquierda) para enfocarlo en una cuenta especifica, o volver al portafolio completo.",
  inputSchema: z.object({
    cuenta: z.string().optional().describe("Id de cuenta a enfocar, ej 'CU-1003'. Omite o usa 'todas' para el portafolio."),
  }),
  execute: async ({ cuenta }) => {
    const id = cuenta && cuenta.toLowerCase() !== "todas" ? cuenta : null;
    if (id && !getCuenta(id)) return { error: `Cuenta ${id} no encontrada` };
    return { cuenta: id, titular: id ? getCuenta(id)!.titular : null };
  },
});

const visualiza = tool({
  description:
    "Muestra una grafica del portafolio en el panel Vision general. Elige el tipo: 'burbujas' (ingresos vs egresos), 'dona' (composicion del saldo) o 'barras' (flujo neto por cuenta).",
  inputSchema: z.object({
    tipo: z.enum(["burbujas", "dona", "barras"]).describe("Tipo de grafica mas adecuado a lo que pide el usuario."),
  }),
  execute: async ({ tipo }) => ({ grafica: tipo }),
});

const simularTransferencia = tool({
  description:
    "Valida (NO ejecuta) una transferencia: revisa fondos y limite diario. Renderiza una tarjeta con botones para que el humano confirme o cancele.",
  inputSchema: z.object({
    cuenta: z.string().describe("Id de cuenta origen, ej 'CU-1001'."),
    monto: z.number().positive().describe("Monto a transferir."),
    destino: z.string().describe("Cuenta o beneficiario destino."),
  }),
  execute: async ({ cuenta, monto, destino }) => {
    const v = validarTransferencia(cuenta, monto, destino);
    if (!v) return { error: `Cuenta ${cuenta} no encontrada` };
    return v;
  },
});

const TOOLS = {
  getKpisCuenta,
  listarMovimientos,
  revisarFraude,
  generarReporte,
  enfocarDashboard,
  visualiza,
  simularTransferencia,
};

// --- El router: la palanca de costo que decide el modelo -------------------
// Un modelo barato clasifica la pregunta y elige quien la atiende. Cuesta
// centesimas de centavo y puede ahorrar la mayoria de la factura, PERO suma
// una llamada de latencia a cada turno. El panel muestra las dos cosas para
// que la decision se tome con numeros, no con fe.
const decision = z.object({
  nivel: z.enum(["simple", "complejo"]),
  motivo: z.string().describe("Una frase: por que ese nivel."),
});

async function elegirModelo(pregunta: string, traza: ReturnType<typeof nuevaTraza>) {
  if (!ROUTER) return { modelo: MODELO_RAZONA, motivo: "router apagado (ROUTER=off)" };
  const t0 = Date.now();
  try {
    const r = await generateObject({
      model: anthropic(MODELO_VOLUMEN),
      schema: decision,
      temperature: 0,
      system:
        "Clasificas preguntas para el copiloto de un banco. " +
        "'simple' = saludo, duda de politica (comisiones, limites, horarios, fraude), consulta de UN dato de UNA cuenta. " +
        "'complejo' = reporte ejecutivo, revision de fraude, comparar cuentas, graficas, transferencias, o varias cosas a la vez. " +
        "Ante la duda: complejo.",
      prompt: pregunta,
    });
    agregarLlamada(traza, {
      etapa: "router",
      modelo: MODELO_VOLUMEN,
      tokens: {
        entrada: r.usage.inputTokens ?? 0,
        salida: r.usage.outputTokens ?? 0,
        cacheLeido: r.usage.cachedInputTokens ?? 0,
      },
      latenciaMs: Date.now() - t0,
    });
    return {
      modelo: r.object.nivel === "simple" ? MODELO_VOLUMEN : MODELO_RAZONA,
      motivo: `${r.object.nivel}: ${r.object.motivo}`,
    };
  } catch (e) {
    // Falla ABIERTA hacia el modelo caro: si el router se cae, el cliente
    // recibe la mejor respuesta, no un error. Un ahorro no vale una caida.
    return { modelo: MODELO_RAZONA, motivo: `router fallo, uso el caro: ${(e as Error).message}` };
  }
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const ultimo = messages[messages.length - 1];
  const pregunta =
    ultimo?.parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join(" ") ?? "";

  const traza = nuevaTraza(pregunta, LANGSMITH);
  const t0 = Date.now();

  const { modelo, motivo } = await elegirModelo(pregunta, traza);
  traza.decision = motivo;

  const tDelModelo = Date.now();
  try {
    const result = await streamText({
      model: anthropic(modelo),
      // El system va como MENSAJE para poder marcarlo como cacheable. Como
      // string plano no hay donde colgar el cache_control.
      messages: [
        {
          role: "system" as const,
          content: SISTEMA,
          providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
        },
        ...convertToModelMessages(messages),
      ],
      // El AI SDK advierte cuando un mensaje 'system' viene dentro de
      // `messages`, porque si ese texto viniera del usuario seria una puerta
      // de inyeccion de prompt. Aqui es nuestra constante del servidor, por
      // eso lo permitimos de forma explicita. Nunca metas texto del usuario
      // en un mensaje system.
      allowSystemInMessages: true,
      tools: TOOLS,
      stopWhen: stepCountIs(5),
      // Esto es lo que hace medible el turno. onFinish corre cuando el stream
      // termina de verdad, con el uso de TODOS los pasos sumado.
      onFinish: async ({ usage, steps }) => {
        // Los tokens ESCRITOS al cache se suman paso por paso: el
        // providerMetadata del final solo trae los del ultimo paso, y en un
        // turno con tools la escritura ocurre en el primero. Medido el
        // 2026-10-22: leerlo del final reportaba 0 y escondia el 1.25x.
        const cacheEscrito = steps.reduce(
          (a, s) => a + ((s.providerMetadata?.anthropic?.cacheCreationInputTokens as number | null) ?? 0),
          0,
        );
        agregarLlamada(traza, {
          etapa: "copiloto",
          modelo,
          tokens: {
            entrada: usage.inputTokens ?? 0,
            salida: usage.outputTokens ?? 0,
            cacheLeido: usage.cachedInputTokens ?? 0,
            cacheEscrito,
          },
          latenciaMs: Date.now() - tDelModelo,
          pasos: steps.length,
          tools: steps.flatMap((s) => s.toolCalls.map((c) => c.toolName)),
        });
        cerrarTraza(traza, Date.now() - t0);
      },
      onError: ({ error }) => {
        cerrarTraza(traza, Date.now() - t0, (error as Error).message ?? String(error));
      },
    });
    return result.toUIMessageStreamResponse();
  } catch (e) {
    cerrarTraza(traza, Date.now() - t0, (e as Error).message);
    throw e;
  }
}
