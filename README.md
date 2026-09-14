# IA Agéntica Aplicada · Repositorio del curso

Código de los laboratorios del curso **IA Agéntica Aplicada** de NeuronProcess: 5 semanas, 2 sesiones por semana (10 sesiones). Cada sesión = 30 min de teoría + 90 min de práctica, y cada carpeta es **autocontenida y ejecutable**.

## Cómo empezar

1. Clona el repo:
   ```bash
   git clone https://github.com/urielaubay-bit/ia-agentica-aplicada.git
   cd ia-agentica-aplicada
   ```
2. Consigue tu `ANTHROPIC_API_KEY` en https://console.anthropic.com
3. Entra a la sesión del día, instala y corre (cada carpeta tiene su propio README):
   ```bash
   cd semana-1/sesion-1
   cp .env.example .env      # y pon tu API key
   npm install
   npx tsx --env-file=.env paso3.ts
   ```

## Prerrequisitos

- **Node.js 20+** (`node -v`)
- Un editor (VS Code) y una terminal
- Tu `ANTHROPIC_API_KEY`

## Las 10 sesiones

| Semana | Sesión 1 | Sesión 2 |
|---|---|---|
| 1 · Fundamentos | Loop agéntico + tool tipada | Structured output + tu dominio |
| 2 · UI generativa | Streaming (Next.js) | UI generativa (componentes) |
| 3 · MCP + guardrails | MCP server + tool | Guardrails + scoping por rol |
| 4 · Telegram + RAG | RAG local (embeddings) | Bot de Telegram + allowlist |
| 5 · Producción | Evals | Observabilidad, costo, capstone |

## Stack

TypeScript + Node, Vercel AI SDK, Claude, Next.js. El mismo stack del POC de referencia (Pulse).

## Nota

El AI SDK evoluciona rápido. Si una API difiere de tu versión instalada, revisa la doc del paquete; los conceptos son los mismos. El Cuaderno del Participante trae el detalle pedagógico completo.

---
NeuronProcess · Instructor: Uriel Zamora
