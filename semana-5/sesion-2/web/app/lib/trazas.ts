// Almacen de trazas en memoria del proceso del servidor.
//
// Esto es la observabilidad que NO necesita cuenta en ningun servicio: cada
// turno del copiloto deja aqui una fila con sus llamadas al modelo, tokens,
// latencia y costo, y el panel de la izquierda la lee por /api/trazas.
// LangSmith (opcional) es la version de produccion de lo mismo.
//
// Limites honestos, dilos en clase: vive en RAM, se borra al reiniciar el
// server, y con varias instancias cada una tendria sus propias trazas. En
// produccion esto es una tabla o un servicio de trazas, no un arreglo.

import { TOKENS_CERO, costoUsd, costoUsdSinCache, type Tokens } from "./precios";

export type Etapa = "router" | "copiloto";

export type Llamada = {
  etapa: Etapa;
  modelo: string;
  tokens: Tokens;
  latenciaMs: number;
  costoUsd: number;
  costoSinCacheUsd: number;
  tools: string[];
  pasos: number;
};

export type Traza = {
  id: string;
  ts: number;
  pregunta: string;
  llamadas: Llamada[];
  totalMs: number;
  enCurso: boolean;
  error?: string;
  decision?: string; // que decidio el router y por que
  langsmith: boolean;
};

const LIMITE = 50;

// Next.js recarga los modulos en dev; guardar el arreglo en globalThis evita
// que el historial se borre en cada hot reload.
const g = globalThis as unknown as { __trazas?: Traza[] };
g.__trazas ??= [];
const trazas = g.__trazas;

export function nuevaTraza(pregunta: string, langsmith: boolean): Traza {
  const t: Traza = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: Date.now(),
    pregunta,
    llamadas: [],
    totalMs: 0,
    enCurso: true,
    langsmith,
  };
  trazas.unshift(t);
  trazas.length = Math.min(trazas.length, LIMITE);
  return t;
}

export function agregarLlamada(
  t: Traza,
  datos: {
    etapa: Etapa;
    modelo: string;
    tokens: Partial<Tokens>;
    latenciaMs: number;
    tools?: string[];
    pasos?: number;
  },
) {
  const tokens: Tokens = { ...TOKENS_CERO, ...datos.tokens };
  t.llamadas.push({
    etapa: datos.etapa,
    modelo: datos.modelo,
    tokens,
    latenciaMs: datos.latenciaMs,
    costoUsd: costoUsd(datos.modelo, tokens),
    costoSinCacheUsd: costoUsdSinCache(datos.modelo, tokens),
    tools: datos.tools ?? [],
    pasos: datos.pasos ?? 1,
  });
}

export function cerrarTraza(t: Traza, totalMs: number, error?: string) {
  t.totalMs = totalMs;
  t.enCurso = false;
  if (error) t.error = error;
}

export function listarTrazas(): Traza[] {
  return trazas;
}

export function limpiarTrazas() {
  trazas.length = 0;
}

export type Resumen = {
  turnos: number;
  costoUsd: number;
  costoSinCacheUsd: number;
  tokensEntrada: number;
  tokensSalida: number;
  cacheLeido: number;
  cacheEscrito: number;
  latenciaP50: number;
  errores: number;
};

export function resumen(lista: Traza[] = trazas): Resumen {
  const cerradas = lista.filter((t) => !t.enCurso);
  const llamadas = cerradas.flatMap((t) => t.llamadas);
  const latencias = cerradas.map((t) => t.totalMs).sort((a, b) => a - b);
  const suma = (f: (l: Llamada) => number) => llamadas.reduce((acc, l) => acc + f(l), 0);
  return {
    turnos: cerradas.length,
    costoUsd: suma((l) => l.costoUsd),
    costoSinCacheUsd: suma((l) => l.costoSinCacheUsd),
    tokensEntrada: suma((l) => l.tokens.entrada),
    tokensSalida: suma((l) => l.tokens.salida),
    cacheLeido: suma((l) => l.tokens.cacheLeido),
    cacheEscrito: suma((l) => l.tokens.cacheEscrito),
    // p50 y no promedio: una sola llamada lenta no debe mover la mediana.
    latenciaP50: latencias.length ? latencias[Math.floor(latencias.length / 2)] : 0,
    errores: cerradas.filter((t) => t.error).length,
  };
}
