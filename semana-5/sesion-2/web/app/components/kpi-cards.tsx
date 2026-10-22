// Componente 1: tarjetas de KPI. Renderiza la salida de la tool getKpisCuenta.
export type Kpi = { label: string; value: string; delta?: string; tone?: "up" | "down" | "warn" | "flat" };

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
