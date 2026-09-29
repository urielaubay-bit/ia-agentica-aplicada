// Puente cliente: deja que una tarjeta transmitida en el CHAT actualice el
// panel "Vision general" (canvas principal, izquierda) sin depender del contexto
// de React cruzando el stream. El provider registra su setter aqui; las tarjetas
// del chat llaman aplicarVista(). Es el patron filterDashboard de Pulse.
//
// La "vista" dice QUE muestra el canvas principal:
//   portafolio  -> resumen de todas las cuentas (por defecto)
//   cuenta      -> una cuenta enfocada (KPIs + saldo + movimientos)
//   grafica     -> una visualizacion del portafolio (burbujas / dona / barras)
export type TipoGrafica = "burbujas" | "dona" | "barras";
export type VistaDashboard =
  | { tipo: "portafolio" }
  | { tipo: "cuenta"; cuenta: string }
  | { tipo: "grafica"; grafica: TipoGrafica };

type VistaSetter = (v: VistaDashboard) => void;

let setterActual: VistaSetter | null = null;

export function registrarVista(setter: VistaSetter | null) {
  setterActual = setter;
}

export function aplicarVista(v: VistaDashboard) {
  setterActual?.(v);
}
