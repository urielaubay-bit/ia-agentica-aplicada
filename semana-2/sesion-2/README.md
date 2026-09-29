# Semana 2 · Sesión 2 · UI generativa (dashboard NeuronBank)

**30 min teoría + 90 min práctica.** La salida de cada tool se renderiza como un
componente. El asistente elige la tool; el cliente elige cómo pintarla. Ese es el
patrón: **una tool por tipo de respuesta, un componente por tool.**

Es el mismo copiloto del reto Rakuten (dashboards que responden en lenguaje
natural), adaptado a NeuronBank y con los datos que venimos usando desde Semana 1.

## Instalar y correr
```bash
export ANTHROPIC_API_KEY=sk-...   # requerido: el copiloto usa Claude real
npm install
npm run dev                       # http://localhost:3000
```

## Pruébalo
Escribe (o toca los chips de ejemplo):

- *"KPIs de la cuenta CU-1001"* → tarjetas de **KPI**
- *"Movimientos de CU-1003"* → **tabla** + mini gráfica de saldo
- *"Revisa fraude en CU-1003"* → **tarjeta de anomalías** (cargos por revisar)
- *"Reporte ejecutivo de CU-1002"* → **reporte** con aciertos, riesgos y recomendaciones
- *"Enfoca el dashboard en CU-1003"* → el copiloto **cambia el panel de la izquierda** (Vision general) para enfocarlo en esa cuenta; *"vuelve al portafolio"* lo regresa
- *"Visualiza la composicion del saldo"* → el **modelo elige** el tipo de gráfica (burbujas / dona / barras) y la dibuja en el panel
- *"Transferir 15000 de CU-1001 a beneficiario X"* → tarjeta de **aprobación** (human-in-the-loop): valida y pide **Confirmar / Cancelar**

Las gráficas y las vistas de cuenta se dibujan en el **panel Vision general**
(canvas de la izquierda), no en el chat. El copiloto solo confirma con un chip y
el botón *"← Ver portafolio"* regresa a la vista por defecto.

Cuentas demo: `CU-1001`, `CU-1002`, `CU-1003`. Cada cuenta tiene un color fijo en
todas las gráficas (identidad por color): azul, naranja, aqua.

## Layout (estilo Pulse / Rakuten)
Al cargar se ve un **dashboard del portafolio** (izquierda) y el **copiloto fijo a
la derecha**, como una sidebar:

- **Dashboard** (`app/components/dashboard.tsx`, se renderiza en el servidor): KPIs
  del portafolio, gráfica de saldo total del mes (SVG con relleno degradado) y
  tabla de cuentas. No depende del chat, se ve de inmediato.
- **Copiloto** (`app/components/copilot.tsx`): el chat con UI generativa, fijo en la
  columna derecha. Cada respuesta se dibuja como tarjeta.

### El chat puede renderizar dentro del dashboard
Además de dibujar tarjetas en el chat, el copiloto puede **modificar el panel
Vision general** (enfocarlo en una cuenta). El truco es un *puente cliente*
(`app/dashboard-bridge.ts`): el provider registra su setter ahí y la tarjeta que
transmite la tool lo llama al montarse. Es el mismo patrón `filterDashboard` /
`ApplyFilterCard` de Pulse.

- `app/dashboard-bridge.ts` — `registrarFoco()` / `aplicarFoco()`.
- `app/components/dashboard-provider.tsx` — estado cliente (qué cuenta está enfocada).
- `app/components/enfocar-card.tsx` — tarjeta que aplica el foco al montarse.
- tool `enfocarDashboard` en `route.ts` — la dispara el modelo.

También puedes hacer clic en el nombre de una cuenta en la tabla del portafolio.

## Cómo está armado
| Capa | Archivo | Qué hace |
|---|---|---|
| Datos | `app/api/chat/cuentas.ts` | Las 3 cuentas de NeuronBank + helpers que **calculan** KPIs, fraude, reporte y el resumen del portafolio (no los inventa el modelo). |
| Tools | `app/api/chat/route.ts` | Tools tipadas: `getKpisCuenta`, `listarMovimientos`, `revisarFraude`, `generarReporte`, `enfocarDashboard`, `visualiza`, `simularTransferencia`. |
| Dashboard | `app/components/dashboard.tsx` | Vista del portafolio (o cuenta / gráfica enfocada) que se ve al cargar. |
| Copiloto | `app/components/copilot.tsx` | Chat + `renderParte`: estados de carga y un `case` por tool. |
| Componentes | `app/components/*.tsx` | Un componente por tool. |
| Shell | `app/page.tsx` | Header + grid de dos columnas (dashboard / copiloto). |

## Conceptos de UI generativa (para la clase)
Más allá de "una tool = una tarjeta", esta sesión muestra 4 conceptos clave:

1. **Estados de streaming.** La respuesta llega en fases: primero corre la tool
   (mostramos un **esqueleto**, `cargando.tsx`) y luego se reemplaza por el
   componente real. La UI generativa no es instantánea, es un flujo.
2. **Componentes interactivos (round-trip).** La tarjeta de KPIs trae botones
   (`acciones.tsx`) que **mandan un nuevo mensaje al agente**. La UI que el agente
   dibuja puede disparar la siguiente acción del agente.
3. **UI elegida por el modelo.** Una sola tool `visualiza({ tipo })` y el **modelo
   decide** si conviene burbujas, dona o barras según la pregunta.
4. **Human-in-the-loop.** `simularTransferencia` **valida en código** (guardrail,
   como Semana 1) y **no ejecuta**; la tarjeta (`transferencia-card.tsx`) pide
   confirmación humana antes de dar por buena la operación.

## Dos arquitecturas de UI generativa
Esta carpeta usa el patrón `useChat` (el cliente elige el componente por cada
`tool-*`). La carpeta hermana **`../sesion-2-avanzado`** hace lo mismo pero con
**React Server Components en streaming** (`@ai-sdk/rsc`), donde el **servidor**
crea y transmite el componente, como Pulse. Compáralas en clase.

## Agregar una tarjeta nueva (el ejercicio)
1. Un **helper** en `cuentas.ts` que derive el dato.
2. Una **tool** en `route.ts` que lo devuelva.
3. Un **componente** en `app/components/`.
4. Un **case** en el `switch` de `copilot.tsx` (`renderParte`).

Sin dependencias nuevas: KPIs, tabla, gráficas (SVG) y esqueletos son React + CSS
(`app/globals.css`). El reporte es *structured output que alimenta la UI*, el
mismo espíritu del schema `reporteCuenta` de Semana 1.
