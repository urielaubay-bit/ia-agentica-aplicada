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

> **Único requisito: Docker.** Nada de Node, Python, pip ni compiladores en tu máquina.

### 1. Pon tu API key (una vez)

Crea un archivo `.env` en esta carpeta con tu llave de Anthropic:
```bash
cd semana-3/sesion-2-avanzado
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
```

### 2. Levanta el backend (Postgres + MCP server)

```bash
docker compose up -d --build
docker compose ps            # 'db' healthy y 'mcp' arriba
```
La primera vez construye las imágenes, crea la BD y corre el seed (`db/schema.sql`).
**Resultado esperado:** Postgres `healthy` y el MCP server escuchando en `http://localhost:8000/mcp`.

### 3. Corre el agente

```bash
docker compose run --rm agent "¿Cuál es el saldo de CU-1001 y sus movimientos de septiembre de 2026?"
# o la pregunta por defecto:
docker compose run --rm agent
```
**Resultado esperado:** el agente lista las tools, muestra cuáles llamó
(ej `saldo_cuenta`, `movimientos_por_cuenta`) y responde con los datos reales de Postgres.

### 4. (Opcional) Inspecciona las tools a mano

Si tienes Node, abre el Inspector y conéctate al server que ya corre:
```bash
npx @modelcontextprotocol/inspector@0.15.0
```
Transport **Streamable HTTP**, URL `http://localhost:8000/mcp`, **Connect** → pestaña **Tools** →
`saldo_cuenta({ cuenta: "CU-1001" })` → **Resultado esperado:** `{ "cuenta": "CU-1001", "saldo": 25950 }`.

### Prueba el guardrail (scoping por rol)

Reinicia el MCP server como "cajero" y verás que el agente **no puede** salirse de su cuenta:
```bash
echo "CUENTA=CU-1001" >> .env       # rol cajero: forzado a CU-1001
docker compose up -d mcp            # reinicia el server con el nuevo rol
docker compose run --rm agent "Dame los movimientos de CU-1002"
```
Aunque pidas `CU-1002`, el server fuerza `CU-1001`. El scoping vive en el server, no en el prompt.
(Quita la línea `CUENTA` del `.env` y repite `docker compose up -d mcp` para volver a "analista".)

### Una tool que es una integración: enviar el reporte por correo

Una tool puede hablar con otro sistema. Ya incluimos la tool `enviar_reporte_por_correo`,
que arma el reporte de saldo/movimientos y lo manda por **SMTP**. Por defecto entrega al
buzón de prueba **Mailpit** (corre en Docker con `docker compose up`, **sin credenciales**).

El agente **no se toca**: descubre la tool nueva al conectarse y la llama solo.

```bash
docker compose run --rm agent "Envía el reporte de saldo de CU-1001 a cliente@ejemplo.com"
```
**Resultado esperado:** el agente llama `enviar_reporte_por_correo` y el correo se envía de verdad.
Ábrelo en el buzón:

```
http://localhost:8025
```
Esto funciona para todos, sin llaves ni servicios externos.

**Correo real (opcional):** apunta el SMTP a tu proveedor con variables en el `.env` de esta
carpeta y la misma tool entrega de verdad (reinicia con `docker compose up -d mcp`):
```bash
SMTP_HOST=smtp.gmail.com   SMTP_PORT=587   SMTP_USER=tu@gmail.com   SMTP_PASS=app_password
```

> **Tu turno:** añade otra tool a `server.py` (ej `clientes_por_tipo`), reinicia con
> `docker compose restart mcp` y pídesela al agente.

### Apagar

```bash
docker compose down          # para todo (agrega -v para borrar también los datos de la BD)
```

### Si editas el código

- `server.py` (tools nuevas): `docker compose restart mcp` (está montado como volumen).
- `agent.ts`: `docker compose run --rm --build agent "..."` para reconstruir.

---

## Teoría (30 min): el "connector" y producción

- **Cliente MCP del AI SDK (lo que usamos):** el agente se conecta por HTTP al MCP server
  (`http://mcp:8000/mcp` dentro de la red de Docker, o `localhost:8000` si lo corres fuera).
  Funciona local, ideal para el lab.
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
| `docker compose` falla | Instala **Docker Desktop** y ábrelo antes de correr los comandos. |
| `mcp` no arranca | ¿`docker compose ps` dice `db` healthy? El server espera a que Postgres esté listo; reintenta `docker compose up -d`. |
| El agente falla con credenciales | Falta `ANTHROPIC_API_KEY` en el `.env` de esta carpeta. |
| El Inspector no lista tools | ¿`docker compose ps` muestra `mcp` arriba? Prueba la URL `http://localhost:8000/mcp`. |
| Cambié `server.py` y no pasa nada | `docker compose restart mcp` (el código está montado como volumen). |
| El correo no llega a Mailpit | ¿`docker compose ps` muestra `mailpit` arriba? Ábrelo en `http://localhost:8025`. |

## Checklist
- [ ] Postgres corriendo con el seed de NeuronBank
- [ ] MCP server (FastMCP) en HTTP, probado en el Inspector
- [ ] El agente descubre las tools y responde con datos reales
- [ ] El guardrail `CUENTA` también limita al agente
- [ ] Envié un reporte por correo y lo vi en Mailpit (`http://localhost:8025`)
