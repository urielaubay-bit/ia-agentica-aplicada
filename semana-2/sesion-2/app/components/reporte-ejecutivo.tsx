// Componente 4: reporte ejecutivo. Renderiza la salida de la tool generarReporte.
// Es "structured output que alimenta una UI": el mismo espiritu del schema
// reporteCuenta de Semana 1, ahora como tarjeta.
type Reporte = {
  titular: string;
  cuenta: string;
  resumen: string;
  aciertos: string[];
  riesgos: string[];
  recomendaciones: { accion: string; motivo: string; impacto: string }[];
};

export function ReporteEjecutivo({ reporte }: { reporte: Reporte }) {
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">Reporte ejecutivo</div>
        <span className="card-sub">
          {reporte.titular} · {reporte.cuenta}
        </span>
      </div>
      <p className="card-sub" style={{ marginTop: 0 }}>{reporte.resumen}</p>

      <div className="section">
        <h4 className="up">Aciertos</h4>
        <ul>
          {reporte.aciertos.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </div>

      {reporte.riesgos.length > 0 && (
        <div className="section">
          <h4 className="warn">Riesgos</h4>
          <ul>
            {reporte.riesgos.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="section">
        <h4>Recomendaciones</h4>
        {reporte.recomendaciones.map((r, i) => (
          <div key={i} className="reco">
            <div className="accion">{r.accion}</div>
            <div className="motivo">{r.motivo}</div>
            <span className="badge ok" style={{ marginTop: 6 }}>
              Impacto: {r.impacto}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
