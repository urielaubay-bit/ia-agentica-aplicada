# IA Agéntica Aplicada · Repositorio del curso

Código de los laboratorios del curso **IA Agéntica Aplicada** de NeuronProcess: 5 semanas, 2 sesiones por semana (10 sesiones). Cada sesión = 30 min de teoría + 90 min de práctica, y cada carpeta es **autocontenida y ejecutable**.

> **¿Primera vez? Empieza por [SETUP.md](SETUP.md)** — checklist de ~10 min (Windows y Mac/Linux) para dejar todo listo antes del día 1.

## Cómo empezar

1. Clona el repo:
   ```bash
   git clone https://github.com/urielaubay-bit/ia-agentica-aplicada.git
   cd ia-agentica-aplicada
   ```
2. Consigue tu `ANTHROPIC_API_KEY` en https://console.anthropic.com y **configúrala una sola vez** en tu sistema (así no necesitas `.env` por carpeta):

   **Windows (PowerShell o CMD):**
   ```powershell
   setx ANTHROPIC_API_KEY "sk-ant-..."
   ```
   Luego **cierra y abre una terminal nueva** (o reinicia VS Code): `setx` solo aplica a terminales nuevas.

   **Mac / Linux:**
   ```bash
   echo 'export ANTHROPIC_API_KEY=sk-ant-...' >> ~/.bashrc && source ~/.bashrc
   ```

   (Solo para la Semana 4 · Sesión 2 configura además `BOT_TOKEN` igual: `setx BOT_TOKEN "..."` en Windows, o `export BOT_TOKEN=...` en Mac/Linux.)
3. Entra a la sesión del día, instala y corre. **Sin `.env`, sin `--env-file`**: los scripts leen la key de tu entorno.
   ```bash
   cd semana-1/sesion-1
   npm install
   npx tsx paso3.ts
   ```

## Prerrequisitos

- **Node.js 20+** (`node -v`)
- Un editor (VS Code) y una terminal
- Tu `ANTHROPIC_API_KEY`

## Las 10 sesiones

| Semana | Sesión 1 | Sesión 2 |
|---|---|---|
| 1 · Fundamentos | Loop agéntico + tool tipada | Structured output + agente NeuronBank |
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
