# Semana 2 · Sesión 2 · Avanzado · UI generativa con RSC

La **misma idea** de sesión-2 (el agente responde con componentes, no solo texto)
pero con la arquitectura que usa Pulse: **React Server Components en streaming**.
El agente **crea y transmite componentes ya renderizados en el servidor**, sobre la
marcha, con `@ai-sdk/rsc`.

## Instalar y correr
```bash
export ANTHROPIC_API_KEY=sk-...
npm install
npm run dev            # http://localhost:3000
```

Prueba: *"KPIs de la cuenta CU-1001"* o *"Movimientos de CU-1003"*.

## La diferencia con sesión-2 (el punto de la clase)

| | sesión-2 (`useChat`) | sesión-2-avanzado (RSC) |
|---|---|---|
| La tool devuelve | JSON tipado | JSON tipado |
| Quién elige el componente | el **cliente** (`switch` por `tool-*`) | el **servidor** (`renderToolResult`) |
| Lo que viaja al navegador | datos | **componentes de React ya renderizados** |
| Se transmite (stream) | texto + partes de tool | un **árbol de React** que se va actualizando |
| Librería | `@ai-sdk/react` | `@ai-sdk/rsc` |

En sesión-2 el cliente sabe de antemano qué componente corresponde a cada tool.
Aquí el **servidor** decide qué React montar y lo **transmite**; el cliente solo
pinta `message.display` sin saber qué venía. Eso es "el agente crea y usa
componentes sobre la marcha".

## Cómo está armado
| Archivo | Qué hace |
|---|---|
| `app/ai.ts` | `createAI(...)`: conecta la server action con el estado del cliente. |
| `app/actions.tsx` | `submitMessage`: corre `streamText` y va armando un `createStreamableUI` (texto → componentes de cada tool). |
| `app/components/*.tsx` | Componentes de **servidor** que el agente transmite. |
| `app/page.tsx` | Cliente: `useUIState` + `useActions`; renderiza `message.display`. |
| `app/types.ts` | `AIState` (historial para el modelo) vs `UIState` (mensajes con `display`). |

Nota: como en Pulse, usamos `streamText` + `createStreamableUI` (en vez del antiguo
`streamUI`), que reenvía bien las tools al modelo en las versiones nuevas del SDK.

Requiere React 19 / Next 16 (RSC), por eso vive en su propia carpeta y no dentro
de `sesion-2` (React 18 / Next 14).
