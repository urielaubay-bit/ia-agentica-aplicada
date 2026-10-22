// Grafica de barras (flujo neto del mes por cuenta). La transmite graficaBarras.
// Barras divergentes desde una linea cero: arriba = neto positivo, abajo =
// negativo. Color = cuenta (identidad, consistente con las otras graficas); el
// signo se lee por direccion + etiqueta, no por color. Extremo redondeado 4px.
import type { SerieCuenta } from "../api/chat/cuentas";
import { money } from "../api/chat/cuentas";
import { Legend } from "./grafica-burbujas";

export function GraficaBarras({ datos, caption }: { datos: SerieCuenta[]; caption?: string }) {
  const W = 560, H = 300, T = 24, B = 44;
  const maxAbs = Math.max(...datos.map((d) => Math.abs(d.neto)), 1);
  const plotH = H - T - B;
  const zeroY = T + (plotH * maxAbs) / (2 * maxAbs); // linea cero al centro
  const scale = (v: number) => (Math.abs(v) / maxAbs) * (plotH / 2);
  const bw = 64;
  const step = (W - 40) / datos.length;
  const cx = (i: number) => 40 + step * i + step / 2;

  return (
    <div className="card">
      {caption && <div className="caption">{caption}</div>}
      <div className="card-title" style={{ marginBottom: 8 }}>Flujo neto del mes por cuenta</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Flujo neto por cuenta">
        {/* linea cero recesiva */}
        <line x1={24} y1={zeroY} x2={W - 16} y2={zeroY} stroke="var(--line)" />
        <text x={24} y={zeroY - 4} fontSize="10" fill="var(--muted)">0</text>

        {datos.map((d, i) => {
          const h = scale(d.neto);
          const pos = d.neto >= 0;
          const x = cx(i) - bw / 2;
          const y = pos ? zeroY - h : zeroY;
          return (
            <g key={d.id}>
              <title>{`${d.titular} (${d.id}) · neto ${d.neto >= 0 ? "+" : ""}${money(d.neto)}`}</title>
              <rect x={x} y={y} width={bw} height={Math.max(h, 1)} rx={4} fill={d.color} fillOpacity={0.85} />
              <text x={cx(i)} y={pos ? y - 6 : y + h + 14} textAnchor="middle" fontSize="11" fontWeight={700} fill="var(--ink)">
                {d.neto >= 0 ? "+" : ""}{money(d.neto)}
              </text>
              <text x={cx(i)} y={H - 22} textAnchor="middle" fontSize="11" fill="var(--muted)">{d.id}</text>
              <text x={cx(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--muted)">{d.titular}</text>
            </g>
          );
        })}
      </svg>
      <Legend datos={datos} />
    </div>
  );
}
