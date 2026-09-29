// Componente 2: tabla de movimientos + mini grafica de saldo acumulado.
// Renderiza la salida de la tool listarMovimientos. La grafica es SVG puro
// (sin librerias) para que se sienta un dashboard sin sumar dependencias.
type Movimiento = { fecha: string; concepto: string; monto: number };

const money = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

function Sparkline({ movimientos, saldoFinal }: { movimientos: Movimiento[]; saldoFinal: number }) {
  // Reconstruye el saldo a lo largo del mes desde el saldo final hacia atras.
  const total = movimientos.reduce((s, m) => s + m.monto, 0);
  let running = saldoFinal - total;
  const points = movimientos.map((m) => (running += m.monto));
  const min = Math.min(...points, saldoFinal - total);
  const max = Math.max(...points, saldoFinal);
  const W = 320, H = 56, pad = 4;
  const span = max - min || 1;
  const coords = points.map((p, i) => {
    const x = pad + (i / Math.max(points.length - 1, 1)) * (W - pad * 2);
    const y = H - pad - ((p - min) / span) * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", marginTop: 8 }}>
      <polyline fill="none" stroke="var(--brand)" strokeWidth="2" points={coords.join(" ")} />
    </svg>
  );
}

export function MovimientosTable({
  movimientos,
  saldoFinal,
  caption,
}: {
  movimientos: Movimiento[];
  saldoFinal: number;
  caption?: string;
}) {
  return (
    <div className="card">
      {caption && <div className="caption">{caption}</div>}
      <table className="mov">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Concepto</th>
            <th style={{ textAlign: "right" }}>Monto</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((m, i) => {
            const flag = /revisar|sospechos|dudos/i.test(m.concepto);
            return (
              <tr key={i} className={flag ? "flag" : undefined}>
                <td>{m.fecha}</td>
                <td>{m.concepto}</td>
                <td className={`amount ${m.monto < 0 ? "down" : "up"}`}>{money(m.monto)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Sparkline movimientos={movimientos} saldoFinal={saldoFinal} />
    </div>
  );
}
