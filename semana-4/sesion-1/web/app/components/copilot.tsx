'use client';
import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { FuentesCard } from "./fuentes-card";
import { Cargando } from "./cargando";

// Red de seguridad: si el modelo llegara a escribir HTML/SVG/codigo como texto,
// no lo mostramos (la UI dibuja las tarjetas, no el modelo).
const pareceCodigo = (t: string) => /<\/?[a-z][\s\S]*>/i.test(t) || t.includes("<svg") || t.includes("```");

// Etiqueta del esqueleto mientras corre la tool (estado de streaming). La 1a vez
// incluye bajar el modelo de embeddings y hacer OCR, puede tardar un poco.
const ETIQUETA_TOOL: Record<string, string> = {
  buscarEnBase: "Buscando en la base de conocimiento...",
};

// Ejemplos: la 1a vive en la FAQ (.txt); las ultimas SOLO viven en el PDF
// escaneado que el agente OCR-ea (no estan en faq.txt).
const EJEMPLOS = [
  "Cuanto cuesta una transferencia SPEI menor a 100 mil?",
  "Que es la cuenta Premium PR-2026?",
  "Cuanto cuesta una SPEI mayor a 100 mil?",
  "Cual es el horario de atencion?",
];

export function Copilot() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const enviar = (text: string) => { if (text.trim()) { sendMessage({ text }); setInput(""); } };

  // Un solo lugar que decide que montar por cada parte del mensaje. Igual que en
  // Semana 2: un case por tool. Aqui el texto del asistente ES la respuesta RAG
  // (fundamentada en los fragmentos) y la tool dibuja las fuentes que la citan.
  const renderParte = (part: any, i: number, role: string) => {
    if (part.type === "text") {
      if (role === "user") return <div key={i} className="bubble">{part.text}</div>;
      if (pareceCodigo(part.text)) return null;
      return <p key={i}>{part.text}</p>;
    }
    if (typeof part.type === "string" && part.type.startsWith("tool-")) {
      const name = part.type.slice("tool-".length);
      // Fases del streaming: primero corre la tool (esqueleto), luego el resultado.
      if (part.state === "output-error") return <p key={i} className="down">La busqueda fallo.</p>;
      if (part.state !== "output-available") return <Cargando key={i} label={ETIQUETA_TOOL[name] ?? "Cargando..."} />;

      const d = part.output;
      if (d?.error) return <p key={i} className="down">{d.error}</p>;

      if (name === "buscarEnBase") {
        const n = d.fuentes?.length ?? 0;
        const caption = `top ${n} · mejor sim ${Number(d.mejorScore ?? 0).toFixed(2)}`;
        // Fuentes colapsadas (estilo producto): la respuesta va primero y las
        // "costuras" del RAG quedan a un clic. Transparencia bajo demanda.
        return (
          <details key={i} className="fuentes-toggle">
            <summary>Ver fuentes ({n})</summary>
            <FuentesCard fuentes={d.fuentes} caption={caption} />
          </details>
        );
      }
    }
    return null;
  };

  return (
    <div className="copilot">
      <div className="copilot-head">
        <span className="dot" />
        <span className="copilot-title">Copiloto RAG</span>
        <span className="card-sub">NeuronBank</span>
      </div>

      <div className="copilot-body">
        {messages.length === 0 && (
          <div className="empty">
            <p className="card-sub" style={{ marginTop: 0 }}>
              Pregunta y la respuesta llega con sus fuentes (de la FAQ o del PDF escaneado).
            </p>
            <div className="chip-col">
              {EJEMPLOS.map((e) => (
                <button key={e} className="chip" onClick={() => enviar(e)}>{e}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          // Respuesta PRIMERO, luego las fuentes: el texto del asistente va antes
          // que la tarjeta de la tool (que por streaming llega primero). Orden
          // estable: texto (0), tool (1), resto (2).
          const peso = (p: any) => (p.type === "text" ? 0 : String(p.type).startsWith("tool-") ? 1 : 2);
          const ordenadas = m.parts.map((p, i) => ({ p, i })).sort((a, b) => peso(a.p) - peso(b.p));
          return (
            <div key={m.id} className={`msg ${m.role}`}>
              <div className="who">{m.role === "user" ? "Tu" : "Asistente"}</div>
              {ordenadas.map(({ p, i }) => renderParte(p, i, m.role))}
            </div>
          );
        })}

        {status === "streaming" && <p className="typing">buscando y respondiendo...</p>}
      </div>

      <form className="composer-inline" onSubmit={(e) => { e.preventDefault(); enviar(input); }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: Cual es la comision por SPEI?"
        />
        <button type="submit" disabled={!input.trim() || status === "streaming"}>Enviar</button>
      </form>
    </div>
  );
}
