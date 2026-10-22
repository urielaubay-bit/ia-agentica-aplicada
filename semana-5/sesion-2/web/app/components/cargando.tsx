// Estado de CARGA de una tool. En UI generativa la respuesta llega en fases:
// primero se llama la tool (aun sin salida) y luego llega el resultado. Mientras
// tanto mostramos este esqueleto y despues lo reemplaza el componente real.
export function Cargando({ label }: { label: string }) {
  return (
    <div className="card">
      <div className="card-sub" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span className="spinner" /> {label}
      </div>
      <div className="skeleton-row">
        <span className="skeleton" />
        <span className="skeleton" />
        <span className="skeleton" />
      </div>
    </div>
  );
}
