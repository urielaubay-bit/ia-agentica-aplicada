'use client';
// Dashboard "Vision general" (canvas principal, izquierda). Se ve al CARGAR con
// el portafolio, y el copiloto puede cambiar lo que muestra desde el chat (una
// cuenta enfocada o una grafica) via el puente + provider. Estilo Pulse.
import { money, type PuntoSerie } from "../api/chat/cuentas";
import { useDashboard } from "./dashboard-provider";
import { GraficaBurbujas } from "./grafica-burbujas";
import { GraficaDona } from "./grafica-dona";
import { GraficaBarras } from "./grafica-barras";

const TITULO_GRAFICA = { burbujas: "Burbujas", dona: "Composicion", barras: "Flujo neto" } as const;

export function Dashboard() {
  const { portafolio, vistas, series, vista, setVista } = useDashboard();

  // Vista de una GRAFICA en el canvas principal (lo que pediste: no en el chat).
  if (vista.tipo === "grafica") {
    const g = vista.grafica;
    return (
      <div className="dash">
        <div className="dash-head">
          <div>
            <h1>Vision general · {TITULO_GRAFICA[g]}</h1>
            <p className="card-sub">Grafica del portafolio · pedida al copiloto</p>
          </div>
          <button className="link-btn" onClick={() => setVista({ tipo: "portafolio" })}>← Ver portafolio</button>
        </div>
        {g === "burbujas" && <GraficaBurbujas datos={series} />}
        {g === "dona" && <GraficaDona datos={series} />}
        {g === "barras" && <GraficaBarras datos={series} />}
      </div>
    );
  }

  // Vista enfocada en una cuenta (renderizada dentro de Vision general).
  const cuenta = vista.tipo === "cuenta" ? vistas[vista.cuenta] : null;
  if (cuenta) {
    return (
      <div className="dash">
        <div className="dash-head">
          <div>
            <h1>Vision general · {cuenta.titular}</h1>
            <p className="card-sub">Cuenta {cuenta.cuenta} · enfocada desde el copiloto</p>
          </div>
          <button className="link-btn" onClick={() => setVista({ tipo: "portafolio" })}>← Ver portafolio</button>
        </div>

        <div className="kpis kpis-wide">
          {cuenta.kpis.map((k) => (
            <div key={k.label} className="kpi">
              <div className="k-label">{k.label}</div>
              <div className="k-value">{k.value}</div>
              {k.delta && <div className={`k-delta ${k.tone ?? "flat"}`}>{k.delta}</div>}
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Saldo de la cuenta</div>
            <span className="card-sub">mes en curso</span>
          </div>
          <AreaChart serie={cuenta.serie} />
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Movimientos</div>
            <span className="card-sub">{cuenta.movimientos.length} en el mes</span>
          </div>
          <table className="mov">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th style={{ textAlign: "right" }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {cuenta.movimientos.map((m, i) => {
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
        </div>
      </div>
    );
  }

  // Vista por defecto: portafolio completo.
  const { kpis, serie, cuentas } = portafolio;
  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <h1>Vision general</h1>
          <p className="card-sub">Saldos, movimientos y alertas del portafolio</p>
        </div>
        <span className="badge ok">Al corte de hoy</span>
      </div>

      <div className="kpis kpis-wide">
        {kpis.map((k) => (
          <div key={k.label} className="kpi">
            <div className="k-label">{k.label}</div>
            <div className="k-value">{k.value}</div>
            {k.delta && <div className={`k-delta ${k.tone ?? "flat"}`}>{k.delta}</div>}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Saldo total del portafolio</div>
          <span className="card-sub">mes en curso</span>
        </div>
        <AreaChart serie={serie} />
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Cuentas</div>
          <span className="card-sub">{cuentas.length} activas</span>
        </div>
        <table className="mov">
          <thead>
            <tr>
              <th>Cuenta</th>
              <th style={{ textAlign: "right" }}>Saldo</th>
              <th style={{ textAlign: "right" }}>Mov.</th>
              <th style={{ textAlign: "right" }}>Neto</th>
              <th style={{ textAlign: "right" }}>Fraude</th>
            </tr>
          </thead>
          <tbody>
            {cuentas.map((c) => (
              <tr key={c.id} className={c.alertas ? "flag" : undefined}>
                <td>
                  <button className="cell-link" onClick={() => setVista({ tipo: "cuenta", cuenta: c.id })}>{c.titular}</button>
                  <div className="card-sub">{c.id}</div>
                </td>
                <td className="amount">{money(c.saldo)}</td>
                <td className="amount" style={{ fontWeight: 400 }}>{c.movimientos}</td>
                <td className={`amount ${c.neto < 0 ? "down" : "up"}`}>
                  {c.neto >= 0 ? "+" : ""}{money(c.neto)}
                </td>
                <td style={{ textAlign: "right" }}>
                  <span className={`badge ${c.alertas ? "bad" : "ok"}`}>{c.alertas ? `${c.alertas}` : "0"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Grafica de area (SVG puro, sin librerias) con relleno degradado, al estilo de
// la revenue chart de Pulse.
function AreaChart({ serie }: { serie: PuntoSerie[] }) {
  const W = 560, H = 200, padX = 8, padTop = 12, padBottom = 22;
  const vals = serie.map((p) => p.saldo);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const n = serie.length;
  const x = (i: number) => padX + (i / Math.max(n - 1, 1)) * (W - padX * 2);
  const y = (v: number) => padTop + (1 - (v - min) / span) * (H - padTop - padBottom);

  const line = serie.map((p, i) => `${x(i).toFixed(1)},${y(p.saldo).toFixed(1)}`).join(" ");
  const area = `${padX},${(H - padBottom).toFixed(1)} ${line} ${(W - padX)},${(H - padBottom).toFixed(1)}`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Saldo">
      <defs>
        <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#fill)" />
      <polyline points={line} fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {serie.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.saldo)} r="2.5" fill="var(--brand)" />
      ))}
      <text x={padX} y={H - 6} fontSize="10" fill="var(--muted)">{serie[0]?.fecha}</text>
      <text x={W - padX} y={H - 6} fontSize="10" fill="var(--muted)" textAnchor="end">{serie[n - 1]?.fecha}</text>
    </svg>
  );
}
