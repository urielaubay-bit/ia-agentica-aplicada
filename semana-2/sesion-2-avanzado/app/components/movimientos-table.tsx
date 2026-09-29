// Componente de SERVIDOR (tabla de movimientos) transmitido por el agente.
import { money, type Movimiento } from "../cuentas";

export function MovimientosTable({ movimientos, caption }: { movimientos: Movimiento[]; caption?: string }) {
  return (
    <div className="card">
      {caption && <div className="caption">{caption}</div>}
      <table className="mov">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Concepto</th>
            <th style={{ textAlign: "right" }}>Monto</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((m, i) => {
            const flag = /revisar|sospechos|dudos/i.test(m.concepto);
            return (
              <tr key={i} className={flag ? "flag" : undefined}>
                <td>{m.fecha}</td>
                <td>{m.concepto}</td>
                <td className={`amount ${m.monto < 0 ? "down" : "up"}`}>{money(m.monto)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
