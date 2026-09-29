'use client';
import { useState } from "react";
import { money } from "../api/chat/cuentas";

// HUMAN-IN-THE-LOOP: la tool valida (no ejecuta). Si la transferencia es alta,
// el humano debe CONFIRMAR aqui; al confirmar mandamos un mensaje de vuelta al
// agente. Si no procede, mostramos el motivo. El codigo (no el modelo) es el que
// autoriza: patron de aprobacion en UI generativa.
type Validacion = {
  cuenta: string;
  titular: string;
  monto: number;
  destino: string;
  permitido: boolean;
  motivo: string;
  requiereConfirmacion: boolean;
};

export function TransferenciaCard({ v, onAsk }: { v: Validacion; onAsk: (texto: string) => void }) {
  const [resuelto, setResuelto] = useState<null | "confirmada" | "cancelada">(null);

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">Transferencia</div>
        <span className={`badge ${v.permitido ? (v.requiereConfirmacion ? "warn" : "ok") : "bad"}`}>
          {v.permitido ? (v.requiereConfirmacion ? "Requiere confirmacion" : "Dentro de limites") : "Bloqueada"}
        </span>
      </div>
      <p className="card-sub" style={{ marginTop: 0 }}>
        {money(v.monto)} de <b>{v.titular}</b> ({v.cuenta}) a <b>{v.destino}</b>. {v.motivo}.
      </p>

      {v.permitido && !resuelto && (
        <div className="acciones">
          <button
            className="btn-primary"
            onClick={() => { setResuelto("confirmada"); onAsk(`Confirmo la transferencia de ${v.monto} a ${v.destino} desde ${v.cuenta}.`); }}
          >
            Confirmar
          </button>
          <button
            className="chip"
            onClick={() => { setResuelto("cancelada"); onAsk("Cancela la transferencia."); }}
          >
            Cancelar
          </button>
        </div>
      )}

      {resuelto && (
        <p className={`card-sub ${resuelto === "confirmada" ? "up" : "down"}`} style={{ marginBottom: 0 }}>
          {resuelto === "confirmada" ? "Confirmada por el usuario (queda para revision, no se ejecuta en el demo)." : "Cancelada por el usuario."}
        </p>
      )}
    </div>
  );
}
