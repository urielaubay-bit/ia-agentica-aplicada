// Grafica de dona (composicion). La transmite la tool graficaDona.
// Muestra que parte del saldo total aporta cada cuenta. Color = cuenta.
// Segmentos con separacion de 2px (hueco de superficie), leyenda con % y total
// al centro. Texto en tinta, identidad por color + etiqueta.
import type { SerieCuenta } from "../api/chat/cuentas";
import { money } from "../api/chat/cuentas";

export function GraficaDona({ datos, caption }: { datos: SerieCuenta[]; caption?: string }) {
  const total = datos.reduce((s, d) => s + d.saldo, 0) || 1;
  const r = 70, cx = 90, cy = 90, sw = 26;
  const C = 2 * Math.PI * r;
  const gap = 3; // hueco de superficie entre segmentos

  let acc = 0;
  const segs = datos.map((d) => {
    const frac = d.saldo / total;
    const len = Math.max(frac * C - gap, 0);
    const seg = { color: d.color, dash: `${len} ${C - len}`, offset: -acc * C, pct: frac };
    acc += frac;
    return seg;
  });

  return (
    <div className="card">
      {caption && <div className="caption">{caption}</div>}
      <div className="card-title" style={{ marginBottom: 8 }}>Composicion del saldo por cuenta</div>
      <div className="donut-row">
        <svg width="180" height="180" viewBox="0 0 180 180" role="img" aria-label="Composicion del saldo">
          {segs.map((s, i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none" stroke={s.color} strokeWidth={sw}
              strokeDasharray={s.dash} strokeDashoffset={s.offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          ))}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="var(--muted)">Saldo total</text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize="18" fontWeight={700} fill="var(--ink)">{money(total)}</text>
        </svg>
        <div className="donut-legend">
          {datos.map((d) => (
            <div key={d.id} className="legend-item">
              <span className="swatch" style={{ background: d.color }} />
              <span style={{ flex: 1 }}>{d.titular} <span className="card-sub">({d.id})</span></span>
              <span className="tabular" style={{ fontWeight: 600 }}>{Math.round((d.saldo / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
