// Tabla de precios (USD por millon de tokens) y la aritmetica de costo.
//
// Verificado contra la pagina de precios de Anthropic el 2026-10-22. Si cambia,
// este es el UNICO archivo que hay que editar: el panel, el total y la
// proyeccion salen de aqui.
//
// Reglas de prompt caching (iguales para toda la familia que usamos):
//   - escribir cache (TTL 5 min) = 1.25x el precio de input
//   - leer cache                 = 0.10x el precio de input
// Es decir: la segunda llamada con el mismo prefijo paga una decima parte por
// esos tokens. De ahi sale el ahorro que se ve en el panel.

export const PRECIO_ESCRIBIR_CACHE = 1.25;
export const PRECIO_LEER_CACHE = 0.1;

export type Precio = { entrada: number; salida: number };

export const PRECIOS: Record<string, Precio> = {
  // $/MTok               entrada  salida
  "claude-sonnet-4-5": { entrada: 3.0, salida: 15.0 },
  "claude-haiku-4-5": { entrada: 1.0, salida: 5.0 },
  "claude-sonnet-5-5": { entrada: 2.0, salida: 10.0 },
  "claude-haiku-5-5": { entrada: 0.1, salida: 0.5 },
};

// Tipo de cambio para mostrar el costo en pesos. Es una constante del lab, no
// un servicio de FX: el punto pedagogico es "el costo tiene una moneda que tu
// cliente entiende", no el tipo de cambio del dia.
export const USD_MXN = 18.5;

export type Tokens = {
  entrada: number;
  salida: number;
  cacheLeido: number;
  cacheEscrito: number;
};

export const TOKENS_CERO: Tokens = { entrada: 0, salida: 0, cacheLeido: 0, cacheEscrito: 0 };

// Costo en USD de una llamada. Ojo con la primera linea: en el AI SDK los
// tokens de cache NO vienen incluidos en `entrada`, llegan como campos
// aparte, asi que se suman por separado y cada uno a su propio precio.
export function costoUsd(modelo: string, t: Tokens): number {
  const p = PRECIOS[modelo];
  if (!p) return 0; // modelo que no esta en la tabla: no inventamos un precio
  const porMTok = (tokens: number, precio: number) => (tokens / 1_000_000) * precio;
  return (
    porMTok(t.entrada, p.entrada) +
    porMTok(t.salida, p.salida) +
    porMTok(t.cacheEscrito, p.entrada * PRECIO_ESCRIBIR_CACHE) +
    porMTok(t.cacheLeido, p.entrada * PRECIO_LEER_CACHE)
  );
}

// Lo que habria costado esa misma llamada SIN cache: los tokens cacheados se
// cobrarian a precio lleno de entrada. La diferencia es el ahorro del cache.
export function costoUsdSinCache(modelo: string, t: Tokens): number {
  const p = PRECIOS[modelo];
  if (!p) return 0;
  const entradaTotal = t.entrada + t.cacheLeido + t.cacheEscrito;
  return (entradaTotal / 1_000_000) * p.entrada + (t.salida / 1_000_000) * p.salida;
}

export const usd = (n: number) => `$${n.toFixed(4)}`;
export const mxn = (n: number) => `$${(n * USD_MXN).toFixed(2)}`;

// La cifra que se lleva el cliente: cuanto cuestan 1,000 consultas como estas.
export const por1000 = (costoTotal: number, turnos: number) =>
  turnos === 0 ? 0 : (costoTotal / turnos) * 1000;
