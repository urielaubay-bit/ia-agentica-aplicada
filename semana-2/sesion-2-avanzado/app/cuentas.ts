// Mismos datos de NeuronBank (demo). Aqui la logica es identica a sesion-2; lo
// que CAMBIA es como se dibuja la UI: con RSC en streaming (ver actions.tsx).
export type Movimiento = { fecha: string; concepto: string; monto: number };
export type Cuenta = { titular: string; saldo: number; limiteDiario: number; alertasFraude: number; movimientos: Movimiento[] };

export const CUENTAS: Record<string, Cuenta> = {
  "CU-1001": {
    titular: "Ana Torres", saldo: 18450, limiteDiario: 20000, alertasFraude: 1,
    movimientos: [
      { fecha: "2026-09-02", concepto: "Deposito nomina", monto: 15200 },
      { fecha: "2026-09-06", concepto: "Pago tarjeta", monto: -3200 },
      { fecha: "2026-09-11", concepto: "Cargo suscripcion", monto: -199 },
      { fecha: "2026-09-15", concepto: "Transferencia recibida", monto: 2500 },
      { fecha: "2026-09-19", concepto: "Cargo sospechoso (revisar)", monto: -4990 },
    ],
  },
  "CU-1002": {
    titular: "Luis Ramirez", saldo: 3120, limiteDiario: 10000, alertasFraude: 0,
    movimientos: [
      { fecha: "2026-09-03", concepto: "Deposito", monto: 4000 },
      { fecha: "2026-09-08", concepto: "Compra supermercado", monto: -880 },
      { fecha: "2026-09-14", concepto: "Retiro cajero", monto: -1000 },
    ],
  },
  "CU-1003": {
    titular: "Sofia Mendez", saldo: 47890, limiteDiario: 50000, alertasFraude: 2,
    movimientos: [
      { fecha: "2026-09-01", concepto: "Deposito", monto: 30000 },
      { fecha: "2026-09-05", concepto: "Pago proveedor", monto: -12400 },
      { fecha: "2026-09-10", concepto: "Cargo dudoso (revisar)", monto: -8900 },
      { fecha: "2026-09-18", concepto: "Cargo dudoso (revisar)", monto: -3500 },
    ],
  },
};

export function getCuenta(id: string): Cuenta | null {
  return CUENTAS[id] ?? null;
}

export const money = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

export type Kpi = { label: string; value: string; delta?: string; tone?: "up" | "down" | "warn" | "flat" };

export function kpisDeCuenta(c: Cuenta): Kpi[] {
  const salientes = c.movimientos.filter((m) => m.monto < 0);
  const neto = c.movimientos.reduce((s, m) => s + m.monto, 0);
  return [
    { label: "Saldo", value: money(c.saldo), delta: `neto del mes ${neto >= 0 ? "+" : ""}${money(neto)}`, tone: neto >= 0 ? "up" : "down" },
    { label: "Movimientos (mes)", value: String(c.movimientos.length), delta: `${salientes.length} salientes`, tone: "flat" },
    { label: "Alertas de fraude", value: String(c.alertasFraude), delta: c.alertasFraude ? "por revisar" : "sin alertas", tone: c.alertasFraude ? "warn" : "up" },
    { label: "Limite disponible", value: money(c.limiteDiario), delta: "diario", tone: "flat" },
  ];
}
