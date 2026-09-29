// Fuente de datos de NeuronBank (demo) que venimos usando desde Semana 1.
//
// Separamos DATOS de LOGICA: en produccion esto seria tu core bancario o una API;
// aqui es un objeto en memoria. Las tools del route.ts leen SOLO de este archivo,
// y de aqui salen todos los componentes de UI generativa (KPIs, movimientos,
// fraude, reporte). Si editas una cuenta, cambia toda la UI que la muestra.

export type Movimiento = { fecha: string; concepto: string; monto: number };

export type Cuenta = {
  titular: string;
  saldo: number;
  limiteDiario: number;
  alertasFraude: number;
  movimientos: Movimiento[]; // del mes en curso
};

export const CUENTAS: Record<string, Cuenta> = {
  "CU-1001": {
    titular: "Ana Torres",
    saldo: 18450,
    limiteDiario: 20000,
    alertasFraude: 1,
    movimientos: [
      { fecha: "2026-09-02", concepto: "Deposito nomina", monto: 15200 },
      { fecha: "2026-09-06", concepto: "Pago tarjeta", monto: -3200 },
      { fecha: "2026-09-11", concepto: "Cargo suscripcion", monto: -199 },
      { fecha: "2026-09-15", concepto: "Transferencia recibida", monto: 2500 },
      { fecha: "2026-09-19", concepto: "Cargo sospechoso (revisar)", monto: -4990 },
    ],
  },
  "CU-1002": {
    titular: "Luis Ramirez",
    saldo: 3120,
    limiteDiario: 10000,
    alertasFraude: 0,
    movimientos: [
      { fecha: "2026-09-03", concepto: "Deposito", monto: 4000 },
      { fecha: "2026-09-08", concepto: "Compra supermercado", monto: -880 },
      { fecha: "2026-09-14", concepto: "Retiro cajero", monto: -1000 },
    ],
  },
  "CU-1003": {
    titular: "Sofia Mendez",
    saldo: 47890,
    limiteDiario: 50000,
    alertasFraude: 2,
    movimientos: [
      { fecha: "2026-09-01", concepto: "Deposito", monto: 30000 },
      { fecha: "2026-09-05", concepto: "Pago proveedor", monto: -12400 },
      { fecha: "2026-09-10", concepto: "Cargo dudoso (revisar)", monto: -8900 },
      { fecha: "2026-09-18", concepto: "Cargo dudoso (revisar)", monto: -3500 },
    ],
  },
};

// Unico punto para leer una cuenta. Regresa null si no existe.
export function getCuenta(id: string): Cuenta | null {
  return CUENTAS[id] ?? null;
}

// ---------------------------------------------------------------------------
// Derivaciones: los numeros de la UI se CALCULAN de los datos, no se inventan.
// Cada helper alimenta a una tool distinta (una tool por tipo de respuesta).
// ---------------------------------------------------------------------------

export const money = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

export type Kpi = { label: string; value: string; delta?: string; tone?: "up" | "down" | "warn" | "flat" };

// KPIs de una cuenta, calculados de sus movimientos reales del mes.
export function kpisDeCuenta(c: Cuenta): Kpi[] {
  const salientes = c.movimientos.filter((m) => m.monto < 0);
  const neto = c.movimientos.reduce((s, m) => s + m.monto, 0);
  const usoLimite = Math.round((Math.abs(salientes.reduce((s, m) => s + m.monto, 0)) / c.limiteDiario) * 100);
  return [
    { label: "Saldo", value: money(c.saldo), delta: `neto del mes ${neto >= 0 ? "+" : ""}${money(neto)}`, tone: neto >= 0 ? "up" : "down" },
    { label: "Movimientos (mes)", value: String(c.movimientos.length), delta: `${salientes.length} salientes`, tone: "flat" },
    { label: "Alertas de fraude", value: String(c.alertasFraude), delta: c.alertasFraude ? "por revisar" : "sin alertas", tone: c.alertasFraude ? "warn" : "up" },
    { label: "Limite disponible", value: money(c.limiteDiario), delta: `uso estimado ${usoLimite}%`, tone: usoLimite > 80 ? "warn" : "flat" },
  ];
}

// Deteccion de fraude simple: montos marcados para revisar o cargos altos.
export type Sospechoso = Movimiento & { motivo: string };

export function movimientosSospechosos(c: Cuenta): Sospechoso[] {
  return c.movimientos
    .filter((m) => m.monto < 0)
    .map((m) => {
      const marcado = /revisar|sospechos|dudos/i.test(m.concepto);
      const alto = Math.abs(m.monto) >= c.limiteDiario * 0.25;
      if (marcado) return { ...m, motivo: "marcado para revision manual" };
      if (alto) return { ...m, motivo: `cargo alto (>= 25% del limite diario)` };
      return null;
    })
    .filter((x): x is Sospechoso => x !== null);
}

// Reporte ejecutivo estructurado (mismo espiritu que el schema reporteCuenta de
// Semana 1): titulares, riesgos y recomendaciones, calculados de la cuenta.
export type Reporte = {
  titular: string;
  cuenta: string;
  resumen: string;
  aciertos: string[];
  riesgos: string[];
  recomendaciones: { accion: string; motivo: string; impacto: string }[];
};

export function reporteDeCuenta(id: string, c: Cuenta): Reporte {
  const neto = c.movimientos.reduce((s, m) => s + m.monto, 0);
  const sosp = movimientosSospechosos(c);
  const aciertos: string[] = [];
  if (neto >= 0) aciertos.push(`Flujo neto positivo del mes: ${money(neto)}.`);
  if (c.alertasFraude === 0) aciertos.push("Sin alertas de fraude abiertas.");
  if (c.saldo >= c.limiteDiario * 0.5) aciertos.push("Saldo saludable frente al limite diario.");
  if (aciertos.length === 0) aciertos.push("Cuenta activa con movimientos en el mes.");

  const riesgos = sosp.map((s) => `${s.fecha}: ${s.concepto} (${money(s.monto)}), ${s.motivo}.`);

  const recomendaciones: Reporte["recomendaciones"] = [];
  if (sosp.length > 0) {
    recomendaciones.push({
      accion: "Contactar al cliente para validar los cargos marcados",
      motivo: `${sosp.length} movimiento(s) requieren revision manual`,
      impacto: "Reduce riesgo de fraude y contracargos",
    });
  }
  if (neto < 0) {
    recomendaciones.push({
      accion: "Ofrecer alerta de gasto y corte anticipado",
      motivo: "El flujo neto del mes es negativo",
      impacto: "Mejora la salud financiera y la retencion",
    });
  }
  if (recomendaciones.length === 0) {
    recomendaciones.push({
      accion: "Ofrecer un producto de ahorro o inversion",
      motivo: "Saldo estable y sin alertas",
      impacto: "Aumenta el valor de vida del cliente",
    });
  }

  return {
    titular: c.titular,
    cuenta: id,
    resumen: `${c.titular} (${id}) cerro el mes con saldo de ${money(c.saldo)}, ${c.movimientos.length} movimientos y ${c.alertasFraude} alerta(s) de fraude.`,
    aciertos,
    riesgos,
    recomendaciones,
  };
}

// ---------------------------------------------------------------------------
// Portafolio: agregado de TODAS las cuentas. Alimenta el dashboard que se ve al
// cargar (KPIs, grafica de saldo total y tabla de cuentas). Mismo principio: se
// calcula de cuentas.ts, no lo inventa el modelo.
// ---------------------------------------------------------------------------
export type PuntoSerie = { fecha: string; saldo: number };
export type FilaCuenta = {
  id: string;
  titular: string;
  saldo: number;
  movimientos: number;
  alertas: number;
  neto: number;
};
export type Portafolio = {
  kpis: Kpi[];
  serie: PuntoSerie[];
  cuentas: FilaCuenta[];
};

export function resumenPortafolio(): Portafolio {
  const ids = Object.keys(CUENTAS);
  const cuentas = ids.map((c) => CUENTAS[c]);

  const saldoTotal = cuentas.reduce((s, c) => s + c.saldo, 0);
  const alertasTotal = cuentas.reduce((s, c) => s + c.alertasFraude, 0);
  const movTotal = cuentas.reduce((s, c) => s + c.movimientos.length, 0);
  const netoTotal = cuentas.reduce((s, c) => s + c.movimientos.reduce((a, m) => a + m.monto, 0), 0);

  const kpis: Kpi[] = [
    { label: "Saldo total", value: money(saldoTotal), delta: `neto del mes ${netoTotal >= 0 ? "+" : ""}${money(netoTotal)}`, tone: netoTotal >= 0 ? "up" : "down" },
    { label: "Cuentas activas", value: String(ids.length), delta: "en el portafolio", tone: "flat" },
    { label: "Alertas de fraude", value: String(alertasTotal), delta: alertasTotal ? "por revisar" : "sin alertas", tone: alertasTotal ? "warn" : "up" },
    { label: "Movimientos (mes)", value: String(movTotal), delta: "todas las cuentas", tone: "flat" },
  ];

  // Serie de saldo total del portafolio dia a dia: partimos del saldo inicial
  // (saldo final menos lo que entro/salio en el mes) y aplicamos cada movimiento.
  const saldoInicial = cuentas.reduce((s, c) => s + (c.saldo - c.movimientos.reduce((a, m) => a + m.monto, 0)), 0);
  const eventos = cuentas
    .flatMap((c) => c.movimientos)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  let corriendo = saldoInicial;
  const porFecha = new Map<string, number>();
  for (const e of eventos) {
    corriendo += e.monto;
    porFecha.set(e.fecha, corriendo);
  }
  const serie: PuntoSerie[] = [{ fecha: "inicio", saldo: saldoInicial }, ...[...porFecha].map(([fecha, saldo]) => ({ fecha, saldo }))];

  const filas: FilaCuenta[] = ids.map((id) => {
    const c = CUENTAS[id];
    return {
      id,
      titular: c.titular,
      saldo: c.saldo,
      movimientos: c.movimientos.length,
      alertas: c.alertasFraude,
      neto: c.movimientos.reduce((a, m) => a + m.monto, 0),
    };
  });

  return { kpis, serie, cuentas: filas };
}

// Vista de UNA cuenta para enfocar el dashboard "Vision general" desde el chat.
// El copiloto puede pedir renderizar esta vista dentro del panel izquierdo.
export type VistaCuenta = {
  cuenta: string;
  titular: string;
  saldoFinal: number;
  kpis: Kpi[];
  serie: PuntoSerie[];
  movimientos: Movimiento[];
};

export function vistaCuenta(id: string): VistaCuenta | null {
  const c = getCuenta(id);
  if (!c) return null;
  const total = c.movimientos.reduce((s, m) => s + m.monto, 0);
  let corriendo = c.saldo - total;
  const serie: PuntoSerie[] = [
    { fecha: "inicio", saldo: corriendo },
    ...c.movimientos.map((m) => ({ fecha: m.fecha, saldo: (corriendo += m.monto) })),
  ];
  return { cuenta: id, titular: c.titular, saldoFinal: c.saldo, kpis: kpisDeCuenta(c), serie, movimientos: c.movimientos };
}

// Mapa de todas las vistas, precalculado en el servidor y pasado al provider.
export function todasLasVistas(): Record<string, VistaCuenta> {
  return Object.fromEntries(Object.keys(CUENTAS).map((id) => [id, vistaCuenta(id)!]));
}

// ---------------------------------------------------------------------------
// Datos para las graficas del copiloto (burbujas, dona, barras). El color sigue
// a la CUENTA (identidad), fijo en todas las graficas. Paleta categorica
// validada (skill dataviz): 3 slots = azul / naranja / aqua, apta todo-pares.
// ---------------------------------------------------------------------------
export const COLOR_CUENTA: Record<string, string> = {
  "CU-1001": "#2a78d6", // azul
  "CU-1002": "#eb6834", // naranja
  "CU-1003": "#1baf7a", // aqua
};

export type SerieCuenta = {
  id: string;
  titular: string;
  color: string;
  saldo: number;
  ingresos: number;
  egresos: number; // valor positivo (suma de salidas)
  neto: number;
  movimientos: number;
  alertas: number;
};

export function seriesCuentas(): SerieCuenta[] {
  return Object.keys(CUENTAS).map((id) => {
    const c = CUENTAS[id];
    const ingresos = c.movimientos.filter((m) => m.monto > 0).reduce((s, m) => s + m.monto, 0);
    const egresos = c.movimientos.filter((m) => m.monto < 0).reduce((s, m) => s + Math.abs(m.monto), 0);
    return {
      id,
      titular: c.titular,
      color: COLOR_CUENTA[id] ?? "#2a78d6",
      saldo: c.saldo,
      ingresos,
      egresos,
      neto: ingresos - egresos,
      movimientos: c.movimientos.length,
      alertas: c.alertasFraude,
    };
  });
}

// Validacion de transferencia (guardrail de negocio, igual que Semana 1): el
// codigo decide, no el modelo. NO ejecuta nada; solo valida y, si el monto es
// alto, marca que requiere confirmacion humana (human-in-the-loop en la UI).
export type Validacion = {
  cuenta: string;
  titular: string;
  monto: number;
  destino: string;
  permitido: boolean;
  motivo: string;
  requiereConfirmacion: boolean;
};

export function validarTransferencia(id: string, monto: number, destino: string): Validacion | null {
  const c = getCuenta(id);
  if (!c) return null;
  const base = { cuenta: id, titular: c.titular, monto, destino };
  if (monto <= 0) return { ...base, permitido: false, motivo: "el monto debe ser positivo", requiereConfirmacion: false };
  if (monto > c.saldo) return { ...base, permitido: false, motivo: "fondos insuficientes", requiereConfirmacion: false };
  if (monto > c.limiteDiario) return { ...base, permitido: false, motivo: `excede el limite diario (${money(c.limiteDiario)})`, requiereConfirmacion: false };
  const requiereConfirmacion = monto >= 10000;
  return { ...base, permitido: true, motivo: requiereConfirmacion ? "monto alto: confirmar con el cliente" : "dentro de limites", requiereConfirmacion };
}
