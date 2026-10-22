// Componente 3: tarjeta de fraude / anomalias. Renderiza la salida de la tool
// revisarFraude. Analogo a la "anomaly card" del dashboard de analitica.
type Sospechoso = { fecha: string; concepto: string; monto: number; motivo: string };

const money = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

export function FraudeCard({
  sospechosos,
  caption,
}: {
  sospechosos: Sospechoso[];
  caption?: string;
}) {
  const limpio = sospechosos.length === 0;
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          {limpio ? "✓ Revision de fraude" : "⚠ Revision de fraude"}
        </div>
        <span className={`badge ${limpio ? "ok" : "bad"}`}>
          {limpio ? "Sin alertas" : `${sospechosos.length} por revisar`}
        </span>
      </div>
      {caption && <div className="caption">{caption}</div>}
      {limpio ? (
        <p className="card-sub" style={{ margin: 0 }}>
          No se encontraron cargos sospechosos en el mes.
        </p>
      ) : (
        <div className="section">
          {sospechosos.map((s, i) => (
            <div key={i} className="reco">
              <div className="accion">
                {s.concepto} <span className="down">{money(s.monto)}</span>
              </div>
              <div className="motivo">
                {s.fecha} · {s.motivo}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
