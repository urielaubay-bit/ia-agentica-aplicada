// Grafica de burbujas. La transmite la tool graficaBurbujas.
// Eje X = ingresos del mes, eje Y = egresos del mes, tamano = saldo, color = cuenta.
// Reglas dataviz: ejes discretos, marcas con anillo de superficie, etiqueta
// directa en cada burbuja (regla de relieve), texto en tinta (no color de serie).
import type { SerieCuenta } from "../api/chat/cuentas";
import { money } from "../api/chat/cuentas";

export function GraficaBurbujas({ datos, caption }: { datos: SerieCuenta[]; caption?: string }) {
  const W = 560, H = 320, L = 56, R = 16, T = 16, B = 44;
  const maxX = Math.max(...datos.map((d) => d.ingresos), 1);
  const maxY = Math.max(...datos.map((d) => d.egresos), 1);
  const maxS = Math.max(...datos.map((d) => d.saldo), 1);
  const px = (v: number) => L + (v / maxX) * (W - L - R);
  const py = (v: number) => H - B - (v / maxY) * (H - T - B);
  const rad = (v: number) => 16 + Math.sqrt(v / maxS) * 30;

  return (
    <div className="card">
      {caption && <div className="caption">{caption}</div>}
      <div className="card-title" style={{ marginBottom: 8 }}>Ingresos vs egresos por cuenta</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Grafica de burbujas de cuentas">
        {/* ejes recesivos */}
        <line x1={L} y1={T} x2={L} y2={H - B} stroke="var(--line)" />
        <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="var(--line)" />
        <text x={L} y={H - 14} fontSize="11" fill="var(--muted)">Ingresos →</text>
        <text x={14} y={T + 6} fontSize="11" fill="var(--muted)" transform={`rotate(-90 14 ${T + 6})`}>Egresos →</text>

        {datos.map((d) => (
          <g key={d.id}>
            <title>{`${d.titular} (${d.id}) · ingresos ${money(d.ingresos)} · egresos ${money(d.egresos)} · saldo ${money(d.saldo)}`}</title>
            <circle cx={px(d.ingresos)} cy={py(d.egresos)} r={rad(d.saldo)} fill={d.color} fillOpacity={0.7} stroke="var(--panel)" strokeWidth={2} />
            <text x={px(d.ingresos)} y={py(d.egresos)} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight={700} fill="#fff">
              {d.id.replace("CU-", "")}
            </text>
          </g>
        ))}
      </svg>
      <Legend datos={datos} extra="tamano = saldo" />
    </div>
  );
}

export function Legend({ datos, extra }: { datos: SerieCuenta[]; extra?: string }) {
  return (
    <div className="legend">
      {datos.map((d) => (
        <span key={d.id} className="legend-item">
          <span className="swatch" style={{ background: d.color }} />
          {d.titular} <span className="card-sub">({d.id})</span>
        </span>
      ))}
      {extra && <span className="card-sub">{extra}</span>}
    </div>
  );
}
