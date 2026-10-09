'use client';
import { useEffect, useState } from "react";

type Estado = {
  fase: "idle" | "indexando" | "listo" | "error";
  error?: string;
  total: number;
  porFuente: Record<string, number>;
};

// Panel izquierdo: explica la base de conocimiento y muestra el estado del
// indice EN VIVO. Construir el indice tiene fases (igual que el streaming de una
// tool): primero el agente OCR-ea el PDF escaneado y se calculan los embeddings
// locales, luego queda "listo". Al montarse dispara /api/estado, que arranca la
// construccion y reporta el avance; aqui se ve ese flujo.
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
  const faq = contar(e, (f) => f.endsWith(".txt"));
  const pdf = contar(e, (f) => f.endsWith(".pdf"));

  const texto: Record<Estado["fase"], string> = {
    idle: "Preparando...",
    indexando: "Indexando: OCR del PDF + embeddings locales...",
    listo: `Indice listo: ${e?.total ?? 0} fragmentos`,
    error: `Error al indexar: ${e?.error ?? ""}`,
  };

  return (
    <div className="kb">
      <div>
        <h1>Base de conocimiento</h1>
        <p className="lead">
          El mismo RAG de la sesion, ahora con front-end. Pregunta en el copiloto
          de la derecha y cada respuesta llega citando los fragmentos que recupero
          del indice, con su score y su fuente.
        </p>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Pipeline</div>
          <span className="card-sub">chunking · embeddings locales · recuperacion</span>
        </div>
        <div className="pipeline">
          <div className="step">
            <span className="n">1</span>
            <div className="t">Ingesta + chunking</div>
            <div className="d">La FAQ (.txt) se parte en fragmentos (un parrafo = un fragmento).</div>
          </div>
          <div className="step">
            <span className="n">2</span>
            <div className="t">OCR del PDF escaneado</div>
            <div className="d">El agente (Claude con vision) transcribe el PDF y su texto entra al MISMO indice.</div>
          </div>
          <div className="step">
            <span className="n">3</span>
            <div className="t">Embeddings + similitud</div>
            <div className="d">Cada fragmento se vectoriza en tu maquina; la pregunta recupera los mas cercanos.</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Fuentes</div>
          <span className="card-sub">docs/</span>
        </div>
        <div className="fuentes">
          <div className="source">
            <span className="ic">📄</span>
            <div className="meta">
              <div className="name">faq.txt <span className="badge ok">FAQ</span></div>
              <div className="desc">FAQ de NeuronBank: comision SPEI, limites, credito, fraude, horarios, tasas.</div>
            </div>
            <span className="count">{fase === "listo" ? `${faq} frag.` : "—"}</span>
          </div>
          <div className="source">
            <span className="ic">🖨️</span>
            <div className="meta">
              <div className="name">aviso-comisiones.pdf <span className="badge warn">PDF escaneado · OCR</span></div>
              <div className="desc">PDF solo-imagen (sin capa de texto). Lo lee el agente con vision; incluye datos que NO estan en la FAQ (SPEI &gt; $100,000, cuenta Premium PR-2026).</div>
            </div>
            <span className="count">{fase === "listo" ? `${pdf} frag.` : "—"}</span>
          </div>
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

function contar(e: Estado | null, pred: (fuente: string) => boolean): number {
  if (!e) return 0;
  return Object.entries(e.porFuente)
    .filter(([f]) => pred(f))
    .reduce((s, [, n]) => s + n, 0);
}
