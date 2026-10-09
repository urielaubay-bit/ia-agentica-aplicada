import { BaseConocimiento } from "./components/base-conocimiento";
import { Copilot } from "./components/copilot";

// Shell estilo Pulse (el mismo de Semana 2): header + dos columnas. Izquierda:
// la base de conocimiento y el estado del indice. Derecha: el copiloto RAG,
// fijo como sidebar. Cada respuesta del chat se dibuja con sus fuentes.
export default function Page() {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">NB</span>
          <span className="brand-name">NeuronBank</span>
          <span className="brand-sub">RAG</span>
        </div>
        <span className="card-sub">Semana 4 · Sesion 1 · RAG con UI generativa</span>
      </header>

      <div className="grid">
        <main className="col-main">
          <BaseConocimiento />
        </main>
        <aside className="col-aside">
          <Copilot />
        </aside>
      </div>
    </div>
  );
}
