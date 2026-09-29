import { resumenPortafolio, todasLasVistas, seriesCuentas } from "./api/chat/cuentas";
import { DashboardProvider } from "./components/dashboard-provider";
import { Dashboard } from "./components/dashboard";
import { Copilot } from "./components/copilot";

// Shell estilo Pulse (Rakuten): header + dos columnas. Izquierda: el dashboard
// del portafolio (se ve al cargar y el copiloto puede enfocarlo). Derecha: el
// copiloto, fijo como una sidebar. Los datos se calculan en el servidor y se
// pasan al provider cliente, que guarda que cuenta esta enfocada.
export default function Page() {
  const portafolio = resumenPortafolio();
  const vistas = todasLasVistas();
  const series = seriesCuentas();

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">NB</span>
          <span className="brand-name">NeuronBank</span>
          <span className="brand-sub">Panel</span>
        </div>
        <span className="card-sub">Semana 2 · Sesion 2 · UI generativa</span>
      </header>

      <DashboardProvider portafolio={portafolio} vistas={vistas} series={series}>
        <div className="grid">
          <main className="col-main">
            <Dashboard />
          </main>
          <aside className="col-aside">
            <Copilot />
          </aside>
        </div>
      </DashboardProvider>
    </div>
  );
}
