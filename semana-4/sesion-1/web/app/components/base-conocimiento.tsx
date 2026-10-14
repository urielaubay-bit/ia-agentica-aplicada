'use client';
import { useEffect, useState } from "react";

type Estado = {
  fase: "idle" | "indexando" | "listo" | "error";
  error?: string;
  total: number;
  porFuente: Record<string, number>;
};

// Descripciones amigables para las fuentes conocidas (las demas se muestran con
// su nombre de archivo tal cual).
const DESC: Record<string, string> = {
  "faq.txt": "FAQ de NeuronBank: comision SPEI, limites, credito, fraude, horarios, tasas.",
  "aviso-comisiones.pdf": "Aviso de comisiones (PDF escaneado). El agente lo OCR-ea; trae datos que no estan en la FAQ.",
  "estado-cuenta-neuronbank.pdf": "Estado de cuenta demo (PDF de 8 hojas, datos ficticios). OCR + chunking por ventanas para poder preguntarle cualquier cosa.",
};

// Panel izquierdo: explica la base de conocimiento y muestra el estado del indice
// EN VIVO. Construir el indice tiene fases (igual que el streaming de una tool):
// el agente OCR-ea cada PDF (cacheado) y se calculan los embeddings, luego queda
// "listo". Al montarse dispara /api/estado, que arranca la construccion y reporta
// el avance; aqui se ve ese flujo. Las fuentes se listan desde el indice.
export function BaseConocimiento() {
  const [e, setE] = useState<Estado | null>(null);

  useEffect(() => {
    let vivo = true;
    const tick = async () => {
      try {
        const r = await fetch("/api/estado");
        const j = (await r.json()) as Estado;
        if (!vivo) return;
        setE(j);
        if (j.fase !== "listo" && j.fase !== "error") setTimeout(tick, 1500);
      } catch {
        if (vivo) setTimeout(tick, 1500);
      }
    };
    tick();
    return () => { vivo = false; };
  }, []);

  const fase = e?.fase ?? "idle";
  const fuentes = Object.entries(e?.porFuente ?? {}).sort(([a], [b]) => a.localeCompare(b));

  const texto: Record<Estado["fase"], string> = {
    idle: "Preparando...",
    indexando: "Indexando: OCR de los PDF (cacheado) + embeddings...",
    listo: `Indice listo: ${e?.total ?? 0} fragmentos`,
    error: `Error al indexar: ${e?.error ?? ""}`,
  };

  return (
    <div className="kb">
      <div>
        <h1>Base de conocimiento</h1>
        <p className="lead">
          RAG con front-end sobre documentos reales. Pregunta en el copiloto de la
          derecha y cada respuesta llega citando los fragmentos que recupero del
          indice (busqueda hibrida + ventanas), con su score y su fuente.
        </p>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Pipeline</div>
          <span className="card-sub">OCR · chunking · embeddings · recuperacion hibrida</span>
        </div>
        <div className="pipeline">
          <div className="step">
            <span className="n">1</span>
            <div className="t">OCR del agente (cacheado)</div>
            <div className="d">Claude con vision lee cada PDF; el texto se guarda en docs/*.ocr.txt y se reusa.</div>
          </div>
          <div className="step">
            <span className="n">2</span>
            <div className="t">Chunking por ventanas</div>
            <div className="d">La FAQ por parrafo; los PDF en ventanas con solape + dedup, para no perder el dato clave.</div>
          </div>
          <div className="step">
            <span className="n">3</span>
            <div className="t">Embeddings + hibrido</div>
            <div className="d">Embeddings multilingues locales; la pregunta recupera por coseno + lexico, o se abstiene.</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Fuentes</div>
          <span className="card-sub">docs/</span>
        </div>
        <div className="fuentes">
          {fuentes.length === 0 && <div className="card-sub">Indexando...</div>}
          {fuentes.map(([fuente, n]) => {
            const esPdf = fuente.toLowerCase().endsWith(".pdf");
            return (
              <div className="source" key={fuente}>
                <span className="ic">{esPdf ? "🖨️" : "📄"}</span>
                <div className="meta">
                  <div className="name">
                    {fuente}{" "}
                    <span className={`badge ${esPdf ? "warn" : "ok"}`}>{esPdf ? "PDF · OCR" : "texto"}</span>
                  </div>
                  <div className="desc">{DESC[fuente] ?? "Documento indexado en la base."}</div>
                </div>
                <span className="count">{n} frag.</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className={`estado ${fase === "error" ? "down" : ""}`}>
          <span className={`dot ${fase}`} />
          <span>{texto[fase]}</span>
        </div>
      </div>
    </div>
  );
}
