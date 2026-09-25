// Fuente de datos de cuentas NeuronBank (demo).
//
// Este es "el otro archivo" del que leen las tools: separamos los DATOS de la
// LOGICA. En la vida real esto seria una consulta a la base o a una API; aqui es
// un objeto en memoria para el lab.
//
// Para el lab: agrega o edita cuentas aqui. Cada cuenta debe tener datos
// DISTINTOS (asi se ve que el copiloto responde por cuenta y no repite lo mismo).

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
