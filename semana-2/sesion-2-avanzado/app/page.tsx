"use client";
import { useState } from "react";
import { useUIState, useActions } from "@ai-sdk/rsc";
import type { AIType } from "./ai";

const EJEMPLOS = ["KPIs de la cuenta CU-1001", "Movimientos de CU-1003"];

// El cliente NO sabe que componente vendra: recibe `display` (un arbol de React
// ya renderizado en el servidor) y lo pinta. Compara con sesion-2, donde el
// cliente tenia un `case` por tool. Aqui el SERVIDOR elige el componente.
export default function Page() {
  const [messages, setMessages] = useUIState<AIType>();
  const { submitMessage } = useActions<AIType>();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const enviar = async (text: string) => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setInput("");
    const id = Math.random().toString(36).slice(2, 10);
    setMessages((prev) => [...prev, { id, role: "user", display: <div className="bubble">{text}</div> }]);
    const reply = await submitMessage(text);
    setMessages((prev) => [...prev, reply]);
    setBusy(false);
  };

  return (
    <main className="app">
      <div className="app-head">
        <h1>Copiloto NeuronBank</h1>
        <span className="tag">RSC en streaming · Semana 2 · Sesion 2 (avanzado)</span>
      </div>
      <p className="hint">
        El agente transmite <b>componentes de servidor</b> (RSC), no JSON. Cuentas:{" "}
        <code>CU-1001</code> <code>CU-1002</code> <code>CU-1003</code>.
      </p>

      {messages.length === 0 && (
        <div className="chip-row">
          {EJEMPLOS.map((e) => (
            <button key={e} className="chip" onClick={() => enviar(e)}>{e}</button>
          ))}
        </div>
      )}

      {messages.map((m) => (
        <div key={m.id} className={`msg ${m.role}`}>
          <div className="who">{m.role === "user" ? "Tu" : "Asistente"}</div>
          {m.display}
        </div>
      ))}

      {busy && <p className="typing">enviando...</p>}

      <form className="composer" onSubmit={(e) => { e.preventDefault(); enviar(input); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ej: KPIs de la cuenta CU-1002" />
        <button type="submit" disabled={!input.trim() || busy}>Enviar</button>
      </form>
    </main>
  );
}
