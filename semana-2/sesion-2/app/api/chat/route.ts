import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool, stepCountIs, convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";
import {
  getCuenta,
  kpisDeCuenta,
  movimientosSospechosos,
  reporteDeCuenta,
  validarTransferencia,
} from "./cuentas";

export const maxDuration = 30;

// UI generativa, el patron: UNA tool por tipo de respuesta, UN componente por
// tool. La salida de cada tool (JSON tipado) se renderiza en el cliente como un
// componente distinto (page.tsx). Todos los numeros salen de cuentas.ts, no del
// modelo, asi el asistente no inventa cifras.

const cuentaArg = z.object({
  cuenta: z.string().optional().describe("Id de cuenta, ej 'CU-1001'. Omite para la principal."),
});

// 1) KPIs -> tarjetas
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

// 2) Movimientos -> tabla + mini grafica
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

// 3) Fraude -> tarjeta de anomalias
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

// 4) Reporte ejecutivo -> tarjeta de reporte (structured output que alimenta UI)
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

// 5) Enfocar el DASHBOARD (panel "Vision general" de la izquierda) en una
// cuenta, o volver al portafolio. La tarjeta que se transmite actualiza el
// panel via el puente cliente. Analogo al filterDashboard de Pulse.
const enfocarDashboard = tool({
  description:
    "Cambia el panel 'Vision general' (dashboard de la izquierda) para enfocarlo en una cuenta especifica, o volver al portafolio completo. Usalo cuando pidan 'enfoca/muestra el dashboard en CU-xxxx' o 'vuelve al portafolio'.",
  inputSchema: z.object({
    cuenta: z.string().optional().describe("Id de cuenta a enfocar, ej 'CU-1003'. Omite o usa 'todas' para el portafolio completo."),
  }),
  execute: async ({ cuenta }) => {
    const id = cuenta && cuenta.toLowerCase() !== "todas" ? cuenta : null;
    if (id && !getCuenta(id)) return { error: `Cuenta ${id} no encontrada` };
    return { cuenta: id, titular: id ? getCuenta(id)!.titular : null };
  },
});

// 6) UI ELEGIDA POR EL MODELO: una sola tool y el modelo decide el TIPO de
// grafica (enum). La grafica se dibuja en el panel "Vision general". Concepto:
// el modelo no solo llama una UI fija, elige cual segun la pregunta.
const visualiza = tool({
  description:
    "Muestra una grafica del portafolio en el panel Vision general. Elige el tipo: 'burbujas' (ingresos vs egresos, dos ejes), 'dona' (composicion/distribucion del saldo) o 'barras' (flujo neto por cuenta).",
  inputSchema: z.object({
    tipo: z.enum(["burbujas", "dona", "barras"]).describe("Tipo de grafica mas adecuado a lo que pide el usuario."),
  }),
  execute: async ({ tipo }) => ({ grafica: tipo }),
});

// 7) HUMAN-IN-THE-LOOP: valida una transferencia (guardrail en codigo, no la
// ejecuta). Si es alta, requiere confirmacion; la tarjeta muestra botones y el
// usuario aprueba o cancela. El modelo NUNCA ejecuta la transferencia.
const simularTransferencia = tool({
  description:
    "Valida (NO ejecuta) una transferencia: revisa fondos y limite diario. Renderiza una tarjeta con el resultado y, si procede, botones para que el humano confirme o cancele.",
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

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: anthropic("claude-sonnet-4-5"),
    system:
      "Eres el copiloto de NeuronBank. Usa las tools para datos reales de la cuenta; nunca inventes cifras. " +
      "Elige la tool segun lo que pida el usuario: KPIs (getKpisCuenta), movimientos (listarMovimientos), " +
      "revision de fraude (revisarFraude), reporte ejecutivo (generarReporte) o enfocar el dashboard (enfocarDashboard). " +
      "Para graficas del portafolio usa visualiza y ELIGE el tipo (burbujas, dona o barras) segun la pregunta; se dibuja en el panel 'Vision general'. " +
      "Si piden ver, enfocar o abrir el dashboard/panel 'Vision general' de una cuenta, usa enfocarDashboard. " +
      "Para transferencias usa simularTransferencia: SOLO validas, NUNCA ejecutas. Si el usuario confirma una transferencia validada, reconoce que quedaria registrada para revision; no la ejecutas tu. " +
      "REGLA IMPORTANTE: NUNCA escribas HTML, SVG, markdown de imagenes ni codigo en tu respuesta. Las tarjetas y graficas las dibuja la interfaz a partir de las tools. " +
      "Tu texto debe ser UNA sola frase breve en lenguaje natural, sin etiquetas ni '<...>'. " +
      "Cuentas demo: CU-1001, CU-1002, CU-1003.",
    messages: convertToModelMessages(messages),
    tools: { getKpisCuenta, listarMovimientos, revisarFraude, generarReporte, enfocarDashboard, visualiza, simularTransferencia },
    stopWhen: stepCountIs(5),
  });
  return result.toUIMessageStreamResponse();
}
