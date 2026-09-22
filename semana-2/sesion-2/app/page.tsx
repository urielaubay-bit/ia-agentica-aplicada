'use client';
import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { KpiCards } from "./kpi-cards";

export default function Page() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
      <h2>Copiloto NeuronBank (UI generativa)</h2>
      {messages.map((m) => (
        <div key={m.id} style={{ marginBottom: 12 }}>
          <b>{m.role === "user" ? "Tu" : "Asistente"}:</b>
          {m.parts.map((part, i) => {
            if (part.type === "text") return <p key={i}>{part.text}</p>;
            if (part.type === "tool-getKpisCuenta" && part.state === "output-available") {
              const d = part.output as any;
              return <KpiCards key={i} kpis={d.kpis} caption={`${d.cuenta} · ${d.mes}`} />;
            }
            return null;
          })}
        </div>
      ))}
      <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) { sendMessage({ text: input }); setInput(""); } }}>
        <input style={{ width: "100%", padding: 8 }} value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Muéstrame los KPIs de la cuenta CU-1001" />
      </form>
      {status === "streaming" && <p style={{ color: "#888", fontSize: 12 }}>escribiendo...</p>}
    </main>
  );
}
