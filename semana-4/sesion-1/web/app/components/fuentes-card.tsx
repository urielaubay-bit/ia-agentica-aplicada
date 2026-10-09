// Componente de la tool buscarEnBase: pinta los fragmentos que RAG recupero del
// indice como "fuentes" citables. Cada uno muestra:
//   - su score de similitud (barra 0..1): el "por que" de la recuperacion,
//   - una insignia con su origen: la FAQ (.txt) o el PDF escaneado (via OCR del
//     agente). Asi se ve que la respuesta se puede CITAR y de donde salio.
// Mismo patron de Semana 2: una tool = un componente.
type Fragmento = { text: string; score: number; fuente: string };

export function FuentesCard({ fuentes, caption }: { fuentes: Fragmento[]; caption?: string }) {
  if (!fuentes?.length) {
    return (
      <div className="card">
        <div className="card-sub">Sin fragmentos relevantes en la base.</div>
      </div>
    );
  }
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">Fragmentos recuperados</div>
        {caption && <span className="card-sub">{caption}</span>}
      </div>
      <div className="fuentes">
        {fuentes.map((f, i) => {
          const esPdf = /\.pdf$/i.test(f.fuente);
          const pct = Math.max(0, Math.min(100, Math.round(f.score * 100)));
          return (
            <div key={i} className="fuente">
              <div className="fuente-top">
                <span className={`badge ${esPdf ? "warn" : "ok"}`}>
                  {esPdf ? "PDF escaneado · OCR" : "FAQ"}
                </span>
                <span className="card-sub tabular">sim {f.score.toFixed(2)}</span>
              </div>
              <div className="score-bar"><span style={{ width: `${pct}%` }} /></div>
              <p className="fuente-text">{f.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
