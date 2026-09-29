'use client';
import { createContext, useContext, useEffect, useState } from "react";
import { registrarVista, type VistaDashboard } from "../dashboard-bridge";
import type { Portafolio, VistaCuenta, SerieCuenta } from "../api/chat/cuentas";

// Estado cliente del dashboard: que muestra el canvas principal (portafolio,
// una cuenta, o una grafica). Los datos vienen precalculados del servidor.
type Ctx = {
  portafolio: Portafolio;
  vistas: Record<string, VistaCuenta>;
  series: SerieCuenta[];
  vista: VistaDashboard;
  setVista: (v: VistaDashboard) => void;
};

const DashboardCtx = createContext<Ctx | null>(null);

export function DashboardProvider({
  portafolio,
  vistas,
  series,
  children,
}: {
  portafolio: Portafolio;
  vistas: Record<string, VistaCuenta>;
  series: SerieCuenta[];
  children: React.ReactNode;
}) {
  const [vista, setVista] = useState<VistaDashboard>({ tipo: "portafolio" });

  // Exponemos setVista al puente para que las tarjetas del chat puedan cambiar
  // el canvas. Validamos que la cuenta exista; si no, volvemos al portafolio.
  useEffect(() => {
    registrarVista((v) => {
      if (v.tipo === "cuenta" && !vistas[v.cuenta]) setVista({ tipo: "portafolio" });
      else setVista(v);
    });
    return () => registrarVista(null);
  }, [vistas]);

  return (
    <DashboardCtx.Provider value={{ portafolio, vistas, series, vista, setVista }}>
      {children}
    </DashboardCtx.Provider>
  );
}

export function useDashboard(): Ctx {
  const ctx = useContext(DashboardCtx);
  if (!ctx) throw new Error("useDashboard debe usarse dentro de DashboardProvider");
  return ctx;
}
