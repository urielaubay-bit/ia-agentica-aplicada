'use client';
import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { KpiCards } from "./kpi-cards";
import { MovimientosTable } from "./movimientos-table";
import { FraudeCard } from "./fraude-card";
import { ReporteEjecutivo } from "./reporte-ejecutivo";
import { EnfocarCard, GraficaCard } from "./enfocar-card";
import { Cargando } from "./cargando";
import { AccionesCuenta } from "./acciones";
import { TransferenciaCard } from "./transferencia-card";

// Red de seguridad: si el modelo llegara a escribir HTML/SVG/codigo como texto,
// no lo mostramos (la UI dibuja las tarjetas, no el modelo).
const pareceCodigo = (t: string) => /<\/?[a-z][\s\S]*>/i.test(t) || t.includes("<svg") || t.includes("```");

// Etiqueta del esqueleto mientras corre cada tool (estado de streaming).
const ETIQUETA_TOOL: Record<string, string> = {
  getKpisCuenta: "Cargando KPIs...",
  listarMovimientos: "Cargando movimientos...",
  revisarFraude: "Revisando fraude...",
  generarReporte: "Generando reporte...",
  enfocarDashboard: "Actualizando panel...",
  visualiza: "Dibujando grafica...",
  simularTransferencia: "Validando transferencia...",
};

const EJEMPLOS = [
  "KPIs de la cuenta CU-1001",
  "Visualiza la composicion del saldo",
  "Transferir 15000 de CU-1001 a beneficiario X",
  "Enfoca el dashboard en CU-1003",
];

export function Copilot() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const enviar = (text: string) => { if (text.trim()) { sendMessage({ text }); setInput(""); } };
  const ask = (text: string) => sendMessage({ text }); // round-trip desde una tarjeta

  // Un solo lugar que decide que componente montar por cada parte del mensaje.
  const renderParte = (part: any, i: number, role: string) => {
    if (part.type === "text") {
      if (role === "user") return <div key={i} className="bubble">{part.text}</div>;
      if (pareceCodigo(part.text)) return null;
      return <p key={i}>{part.text}</p>;
    }
    if (typeof part.type === "string" && part.type.startsWith("tool-")) {
      const name = part.type.slice("tool-".length);
      // Fases del streaming: primero la tool corre (esqueleto), luego el resultado.
      if (part.state === "output-error") return <p key={i} className="down">La tool fallo.</p>;
      if (part.state !== "output-available") return <Cargando key={i} label={ETIQUETA_TOOL[name] ?? "Cargando..."} />;

      const d = part.output;
      if (d?.error) return <p key={i} className="down">{d.error}</p>;

      switch (name) {
        case "getKpisCuenta":
          return (
            <div key={i}>
              <KpiCards kpis={d.kpis} caption={`${d.titular} · ${d.cuenta}`} />
              <AccionesCuenta cuenta={d.cuenta} onAsk={ask} />
            </div>
          );
        case "listarMovimientos":
          return <MovimientosTable key={i} movimientos={d.movimientos} saldoFinal={d.saldoFinal} caption={`${d.titular} · ${d.cuenta}`} />;
        case "revisarFraude":
          return <FraudeCard key={i} sospechosos={d.sospechosos} caption={`${d.titular} · ${d.cuenta}`} />;
        case "generarReporte":
          return <ReporteEjecutivo key={i} reporte={d.reporte} />;
        case "enfocarDashboard":
          return <EnfocarCard key={i} cuenta={d.cuenta} titular={d.titular} />;
        case "visualiza":
          return <GraficaCard key={i} grafica={d.grafica} />;
        case "simularTransferencia":
          return <TransferenciaCard key={i} v={d} onAsk={ask} />;
      }
    }
    return null;
  };

  return (
    <div className="copilot">
      <div className="copilot-head">
        <span className="dot" />
        <span className="copilot-title">Copiloto</span>
        <span className="card-sub">NeuronBank</span>
      </div>

      <div className="copilot-body">
        {messages.length === 0 && (
          <div className="empty">
            <p className="card-sub" style={{ marginTop: 0 }}>
              Pregunta por una cuenta y la respuesta se dibuja como tarjeta.
            </p>
            <div className="chip-col">
              {EJEMPLOS.map((e) => (
                <button key={e} className="chip" onClick={() => enviar(e)}>{e}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role}`}>
            <div className="who">{m.role === "user" ? "Tu" : "Asistente"}</div>
            {m.parts.map((part, i) => renderParte(part, i, m.role))}
          </div>
        ))}

        {status === "streaming" && <p className="typing">escribiendo...</p>}
      </div>

      <form className="composer-inline" onSubmit={(e) => { e.preventDefault(); enviar(input); }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: Reporte ejecutivo de CU-1001"
        />
        <button type="submit" disabled={!input.trim() || status === "streaming"}>Enviar</button>
      </form>
    </div>
  );
}
