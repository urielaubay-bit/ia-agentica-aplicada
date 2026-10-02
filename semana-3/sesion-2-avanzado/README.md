# Semana 3 · Sesión 2 (avanzado) · FastMCP + Postgres + un agente que lo usa

**30 min teoría + 90 min práctica.** Subes de nivel el MCP server de NeuronBank:
de un archivo SQLite en TypeScript a un server **Python con FastMCP** respaldado por
**Postgres**, y escribes un **agente** (Claude, Vercel AI SDK) que lo consume como
cliente MCP para responder preguntas en lenguaje natural.

## Qué cambia respecto a las sesiones 1 y 2

| | Sesión 1 y 2 | Esta sesión (avanzado) |
|---|---|---|
| Framework | `@modelcontextprotocol/sdk` (TS) | **FastMCP** (Python) |
| Datos | archivo SQLite (`banco.db`) | **Postgres** real (Docker), con pool de conexiones |
| Transporte | stdio (lo lanza el cliente) | **HTTP** (el server queda en una URL) |
| Quién lo usa | tú, desde el Inspector | el Inspector **y un agente** que encadena tool-calls |

El guardrail de scoping por rol de la sesión 2 (`CUENTA`) se mantiene, ahora sobre Postgres.

## Arquitectura

```
Agente (TypeScript, Claude vía Vercel AI SDK)
   │  cliente MCP sobre HTTP
   ▼
FastMCP server (Python, http://localhost:8000/mcp)
   │  pool de conexiones (SQL parametrizado, solo lectura)
   ▼
Postgres (Docker): neuronbank (clientes, cuentas, movimientos)
```

## Objetivos

1. Un MCP server de producción en Python (FastMCP, HTTP) sobre una base real.
2. Separar config/secrets por entorno (`DATABASE_URL`, `CUENTA`), nunca en el código.
3. Un agente que **descubre** las tools y **decide** cuáles llamar para responder.

---

## Práctica (90 min)

### 1. Levanta Postgres (Docker)

```bash
cd semana-3/sesion-2-avanzado
docker compose up -d        # crea la BD y corre db/schema.sql (seed) la 1a vez
docker compose ps           # 'healthy' cuando esté listo
```
**Resultado esperado:** el contenedor `neuronbank-db` queda `healthy` en el puerto 5432.

### 2. Arranca el MCP server (Python / FastMCP)

```bash
cd server
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env         # DATABASE_URL ya apunta al Postgres de Docker
python server.py             # HTTP en http://localhost:8000/mcp
```
**Resultado esperado:** el server queda escuchando; verás el log de FastMCP.

### 3. Pruébalo en el Inspector

```bash
npx @modelcontextprotocol/inspector@0.15.0
```
En el Inspector: Transport **Streamable HTTP**, URL `http://localhost:8000/mcp`, **Connect** →
pestaña **Tools** → `saldo_cuenta({ cuenta: "CU-1001" })`.
**Resultado esperado:** `{ "cuenta": "CU-1001", "saldo": 25950 }`.

### 4. El agente que usa el server

```bash
cd ../agent
npm install
cp .env.example .env         # pon tu ANTHROPIC_API_KEY
npm run agent                # pregunta por defecto sobre CU-1001
# o con tu propia pregunta:
npx tsx agent.ts "¿Qué cuenta tuvo el mayor depósito en septiembre?"
```
**Resultado esperado:** el agente lista las tools, muestra qué tools llamó (ej
`saldo_cuenta`, `movimientos_por_cuenta`) y responde con los datos reales de Postgres.

### Prueba el guardrail sobre el agente

Reinicia el server como "cajero" y verás que el agente **no puede** salirse de su cuenta:
```bash
# en la terminal del server:
CUENTA=CU-1001 python server.py
```
Aunque le pidas al agente datos de `CU-1002`, el server fuerza `CU-1001`. El scoping
vive en el server, no en el prompt.

---

## Teoría (30 min): el "connector" y producción

- **Cliente MCP del AI SDK (lo que usamos):** el agente, en tu máquina, se conecta a
  `localhost:8000/mcp`. Funciona local, ideal para el lab.
- **Connector nativo de Claude (`mcp_servers` en la API de Anthropic):** los servidores
  de Anthropic se conectan a TU server, así que necesita una **URL pública** (no alcanza
  `localhost`). Para usarlo: expón el server con un túnel (`ngrok http 8000`) o despliégalo,
  y pásalo como `mcp_servers` en la llamada a la API (beta `mcp-client-2025-11-20`).
- **A producción:** este server ya es HTTP (no stdio), así que se despliega como cualquier
  servicio web: contenedor en **ECS Fargate** / Lambda+API Gateway, detrás de **HTTPS + OAuth**,
  identidad por **IAM role** (sin llaves), y secrets (`DATABASE_URL`) en **Secrets Manager**.
  Postgres pasa de Docker local a **RDS**.

## Si te atoras

| Síntoma | Solución |
|---|---|
| `docker compose` falla | Instala Docker Desktop y ábrelo; reintenta `docker compose up -d`. |
| El server no conecta a la BD | ¿`docker compose ps` dice `healthy`? Revisa `DATABASE_URL` en `.env`. |
| El Inspector no lista tools | ¿El server imprime que escucha en :8000? Prueba la URL `http://localhost:8000/mcp`. |
| El agente falla con credenciales | Falta `ANTHROPIC_API_KEY` en `agent/.env`. |
| Errores de tipos/imports del AI SDK | Versiones probadas: `ai@7`, `@ai-sdk/anthropic@4`, `@ai-sdk/mcp@2` (deben ser de la misma generación). |

## Checklist
- [ ] Postgres corriendo con el seed de NeuronBank
- [ ] MCP server (FastMCP) en HTTP, probado en el Inspector
- [ ] El agente descubre las tools y responde con datos reales
- [ ] El guardrail `CUENTA` también limita al agente
