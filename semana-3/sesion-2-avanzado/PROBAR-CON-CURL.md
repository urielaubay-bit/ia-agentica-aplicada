# Probar el MCP server directo con `curl`

Guía complementaria a la práctica. Aquí hablas con el MCP server **sin agente y sin
Inspector**, mandando las peticiones HTTP a mano con `curl`. Sirve para:

- Entender que **MCP es JSON-RPC 2.0 sobre HTTP**, no magia.
- Probar el server **sin instalar Node** (el Inspector lo necesita; `curl` ya viene en
  Windows, macOS y Linux).
- Depurar cuando el agente falla: ¿es el server o es el agente?

> **Requisito:** el backend tiene que estar arriba. Desde `semana-3/sesion-2-avanzado`:
> ```bash
> docker compose up -d --build
> docker compose ps        # 'db' healthy y 'mcp' arriba
> ```
> El server queda en `http://localhost:8000/mcp`.

---

## Lo que hay que saber antes

El transporte es **Streamable HTTP**. No puedes mandar `tools/call` en frío: hay un
apretón de manos obligatorio.

1. **`initialize`** → el server te devuelve un header `mcp-session-id`.
2. **`notifications/initialized`** → avisas que ya estás listo (sin este paso, el resto falla).
3. Ya puedes llamar **`tools/list`** y **`tools/call`**, siempre repitiendo el `mcp-session-id`.

Dos detalles que tumban a todo el mundo:

- El header **`Accept` debe incluir las dos cosas**: `application/json` y `text/event-stream`.
  Si mandas solo JSON, el server responde `406 Not Acceptable`.
- La respuesta llega como **SSE** (`text/event-stream`), o sea en una línea `data: {...}`.
  Para ver solo el JSON, filtra con `sed -n 's/^data: //p'`.

---

## Paso a paso (copia y pega)

### Variables
```bash
MCP_URL="http://localhost:8000/mcp"
PROTO="2025-06-18"
```

### 1. Initialize y captura el `mcp-session-id`
```bash
SESSION_ID=$(curl -s -D - -o /tmp/mcp-init.txt "$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc":"2.0","id":1,"method":"initialize",
    "params":{
      "protocolVersion":"'"$PROTO"'",
      "capabilities":{},
      "clientInfo":{"name":"curl","version":"1.0"}
    }
  }' \
  | grep -i '^mcp-session-id:' | awk '{print $2}' | tr -d '\r')

echo "Session: $SESSION_ID"
sed -n 's/^data: //p' /tmp/mcp-init.txt     # el result del initialize
```

### 2. Avisa que ya estás listo (notificación, sin `id`)
El server responde `202 Accepted` sin cuerpo. Es normal.
```bash
curl -s "$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "MCP-Protocol-Version: $PROTO" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{"jsonrpc":"2.0","method":"notifications/initialized"}'
```

### 3. Lista las tools
```bash
curl -s "$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "MCP-Protocol-Version: $PROTO" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  | sed -n 's/^data: //p'
```
**Resultado esperado:** las cuatro tools de NeuronBank: `saldo_cuenta`,
`movimientos_por_cuenta`, `resumen_por_tipo`, `enviar_reporte_por_correo`.

### 4. Llama una tool: saldo de una cuenta
```bash
curl -s "$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "MCP-Protocol-Version: $PROTO" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{
    "jsonrpc":"2.0","id":3,"method":"tools/call",
    "params":{
      "name":"saldo_cuenta",
      "arguments":{"cuenta":"CU-1001"}
    }
  }' \
  | sed -n 's/^data: //p'
```
**Resultado esperado:** el saldo real de `CU-1001` desde Postgres (ej `{ "cuenta": "CU-1001", "saldo": 25950 }`).

---

## Las otras tools

Mismos headers y mismo `Mcp-Session-Id`; solo cambia `name` y `arguments`.

**Movimientos de septiembre de 2026:**
```bash
-d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{
  "name":"movimientos_por_cuenta",
  "arguments":{"cuenta":"CU-1001","mes":"2026-09"}}}'
```

**Totales por tipo (deposito / cargo / retiro):**
```bash
-d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{
  "name":"resumen_por_tipo",
  "arguments":{"cuenta":"CU-1001"}}}'
```

**Enviar el reporte por correo (llega a Mailpit, `http://localhost:8025`):**
```bash
-d '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{
  "name":"enviar_reporte_por_correo",
  "arguments":{"cuenta":"CU-1001","destinatario":"cliente@ejemplo.com"}}}'
```

### Prueba el guardrail con curl
Si el server corre como "cajero" (`CUENTA=CU-1001` en el `.env`, luego
`docker compose up -d mcp`), pide otra cuenta y comprueba que el server **te ignora**:
```bash
-d '{"jsonrpc":"2.0","id":7,"method":"tools/call","params":{
  "name":"saldo_cuenta",
  "arguments":{"cuenta":"CU-1002"}}}'
```
Aunque pidas `CU-1002`, la respuesta viene de `CU-1001`. El scoping vive en el server,
no en lo que mandes.

---

## Todo junto: `probar.sh`

Guarda esto como `probar.sh` en esta carpeta y córrelo con `bash probar.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
MCP_URL="${MCP_URL:-http://localhost:8000/mcp}"
PROTO="2025-06-18"
H=(-H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -H "MCP-Protocol-Version: $PROTO")

echo "== initialize =="
SESSION_ID=$(curl -s -D - -o /tmp/mcp-init.txt "$MCP_URL" "${H[@]}" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"'"$PROTO"'","capabilities":{},"clientInfo":{"name":"curl","version":"1.0"}}}' \
  | grep -i '^mcp-session-id:' | awk '{print $2}' | tr -d '\r')
echo "session: $SESSION_ID"

curl -s "$MCP_URL" "${H[@]}" -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{"jsonrpc":"2.0","method":"notifications/initialized"}' >/dev/null

echo "== tools/list =="
curl -s "$MCP_URL" "${H[@]}" -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | sed -n 's/^data: //p'

echo "== saldo_cuenta CU-1001 =="
curl -s "$MCP_URL" "${H[@]}" -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"saldo_cuenta","arguments":{"cuenta":"CU-1001"}}}' | sed -n 's/^data: //p'
```

---

## Windows (sin Git Bash)

El problema en Windows es capturar el `Mcp-Session-Id` en una variable: no hay
`grep`/`awk`/`$(...)`. Aquí van las dos formas nativas.

### PowerShell (recomendado)

PowerShell lee el header directo, sin filtrar texto. La respuesta de las tools llega
como SSE, así que nos quedamos con las líneas `data:`.

```powershell
$MCP_URL = "http://localhost:8000/mcp"
$PROTO   = "2025-06-18"

# 1. initialize y captura del Mcp-Session-Id en $SESSION_ID
$initBody = '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"1.0"}}}'
$resp = Invoke-WebRequest -Uri $MCP_URL -Method Post -Body $initBody -UseBasicParsing `
  -ContentType "application/json" `
  -Headers @{ "Accept" = "application/json, text/event-stream" }

$SESSION_ID = ($resp.Headers["Mcp-Session-Id"] | Select-Object -First 1)
"Session: $SESSION_ID"

# Headers reutilizables para el resto de las llamadas
$H = @{
  "Accept"               = "application/json, text/event-stream"
  "MCP-Protocol-Version" = $PROTO
  "Mcp-Session-Id"       = $SESSION_ID
}

# 2. notificación initialized (sin cuerpo de respuesta)
Invoke-RestMethod -Uri $MCP_URL -Method Post -Headers $H -UseBasicParsing `
  -ContentType "application/json" `
  -Body '{"jsonrpc":"2.0","method":"notifications/initialized"}' | Out-Null

# 3. tools/list  (filtramos las líneas data: del SSE)
$r = Invoke-WebRequest -Uri $MCP_URL -Method Post -Headers $H -UseBasicParsing `
  -ContentType "application/json" `
  -Body '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
($r.Content -split "`n" | Where-Object { $_ -like "data:*" }) -replace '^data: ', ''

# 4. tools/call: saldo de CU-1001
$r = Invoke-WebRequest -Uri $MCP_URL -Method Post -Headers $H -UseBasicParsing `
  -ContentType "application/json" `
  -Body '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"saldo_cuenta","arguments":{"cuenta":"CU-1001"}}}'
($r.Content -split "`n" | Where-Object { $_ -like "data:*" }) -replace '^data: ', ''
```

### CMD (`set SESSION_ID`)

Windows 10/11 trae `curl.exe`. En CMD las comillas del JSON van escapadas con `\"` y la
captura del header se hace con un `for /f`.

```bat
set MCP_URL=http://localhost:8000/mcp

REM 1. initialize: guarda headers y cuerpo en archivos
curl -s -D headers.txt -o init.json %MCP_URL% ^
  -H "Content-Type: application/json" ^
  -H "Accept: application/json, text/event-stream" ^
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2025-06-18\",\"capabilities\":{},\"clientInfo\":{\"name\":\"curl\",\"version\":\"1.0\"}}}"

REM 2. captura el Mcp-Session-Id en la variable SESSION_ID
for /f "tokens=2 delims=: " %i in ('findstr /i "mcp-session-id" headers.txt') do set SESSION_ID=%i
echo Session: %SESSION_ID%

REM 3. tools/list (usa %SESSION_ID%)
curl -s %MCP_URL% ^
  -H "Content-Type: application/json" ^
  -H "Accept: application/json, text/event-stream" ^
  -H "MCP-Protocol-Version: 2025-06-18" ^
  -H "Mcp-Session-Id: %SESSION_ID%" ^
  -d "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/list\",\"params\":{}}"
```

> En un archivo `.bat` duplica el `%` del `for`: usa `%%i` en vez de `%i`.
> `curl.exe` responde en formato SSE (`data: {...}`); en CMD lo ves tal cual.

---

## Si algo falla

| Síntoma | Causa / solución |
|---|---|
| `curl: (7) connection refused` | El backend no está arriba. `docker compose up -d` y revisa `docker compose ps`. |
| `406 Not Acceptable` | Falta `text/event-stream` en el header `Accept`. |
| `400` / "missing session" | No mandaste el header `Mcp-Session-Id`, o se vació la variable. |
| `-32600 invalid request` | Te saltaste el `initialize` o el `notifications/initialized`. |
| La respuesta se ve rara (`event: ... data: ...`) | Es SSE, es normal. En Linux/Mac/Git Bash fíltrala con `sed -n 's/^data: //p'`; en PowerShell con el `-split`/`Where-Object` de arriba; en CMD la ves tal cual. |
| `SESSION_ID` / `$SESSION_ID` sale vacío | El `initialize` falló. Revisa el cuerpo (`/tmp/mcp-init.txt` en Linux/Mac, `init.json` en CMD) y que la URL sea `.../mcp`. |
| PowerShell: `Invoke-WebRequest` truena o se queda colgado | Usa `-UseBasicParsing` (ya incluido arriba) y confirma que Docker está arriba. En Windows 10/11 también puedes usar `curl.exe` (la variante de CMD) desde PowerShell. |
| CMD: el JSON da error | Las comillas internas van escapadas con `\"`; copia el bloque de CMD tal cual, sin cambiar las comillas. |
