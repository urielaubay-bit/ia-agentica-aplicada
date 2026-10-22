// Componente generativo INTERACTIVO: botones que, al hacer clic, mandan un
// nuevo mensaje al agente (round-trip). Concepto clave: la UI que el agente
// dibuja puede, a su vez, disparar la siguiente accion del agente.
export function AccionesCuenta({ cuenta, onAsk }: { cuenta: string; onAsk: (texto: string) => void }) {
  const acciones = [
    { etiqueta: "Ver movimientos", texto: `Movimientos de ${cuenta}` },
    { etiqueta: "Revisar fraude", texto: `Revisa fraude en ${cuenta}` },
    { etiqueta: "Reporte ejecutivo", texto: `Reporte ejecutivo de ${cuenta}` },
  ];
  return (
    <div className="acciones">
      {acciones.map((a) => (
        <button key={a.etiqueta} className="chip" onClick={() => onAsk(a.texto)}>{a.etiqueta}</button>
      ))}
    </div>
  );
}
