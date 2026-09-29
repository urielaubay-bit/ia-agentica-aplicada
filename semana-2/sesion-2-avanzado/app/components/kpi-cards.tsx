// Componente de SERVIDOR que el agente transmite como resultado de una tool.
import type { Kpi } from "../cuentas";

export function KpiCards({ kpis, caption }: { kpis: Kpi[]; caption?: string }) {
  return (
    <div className="card">
      {caption && <div className="caption">{caption}</div>}
      <div className="kpis">
        {kpis.map((k) => (
          <div key={k.label} className="kpi">
            <div className="k-label">{k.label}</div>
            <div className="k-value">{k.value}</div>
            {k.delta && <div className={`k-delta ${k.tone ?? "flat"}`}>{k.delta}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
