'use client';
import { useEffect, useRef } from "react";
import { aplicarVista, type TipoGrafica } from "../dashboard-bridge";

// Tarjetas de confirmacion que, al montarse, cambian el canvas principal
// ("Vision general") via el puente. El chat solo confirma; el dibujo va en el
// panel izquierdo. Es el analogo del ApplyFilterCard de Pulse.

export function EnfocarCard({ cuenta, titular }: { cuenta: string | null; titular: string | null }) {
  const aplicado = useRef(false);
  useEffect(() => {
    if (aplicado.current) return;
    aplicado.current = true;
    aplicarVista(cuenta ? { tipo: "cuenta", cuenta } : { tipo: "portafolio" });
  }, [cuenta]);

  return (
    <div className="card enfocar">
      <span className="badge ok">Panel actualizado</span>
      <span>
        {cuenta
          ? <>Vision general enfocada en <b>{titular}</b> ({cuenta}).</>
          : <>Vision general de vuelta al <b>portafolio completo</b>.</>}
      </span>
    </div>
  );
}

const NOMBRE: Record<TipoGrafica, string> = {
  burbujas: "de burbujas",
  dona: "de dona (composicion del saldo)",
  barras: "de barras (flujo neto)",
};

export function GraficaCard({ grafica }: { grafica: TipoGrafica }) {
  const aplicado = useRef(false);
  useEffect(() => {
    if (aplicado.current) return;
    aplicado.current = true;
    aplicarVista({ tipo: "grafica", grafica });
  }, [grafica]);

  return (
    <div className="card enfocar">
      <span className="badge ok">Panel actualizado</span>
      <span>Grafica <b>{NOMBRE[grafica]}</b> en el panel Vision general.</span>
    </div>
  );
}
