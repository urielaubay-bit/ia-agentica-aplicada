# Semana 3 · Sesión 1 · Tu primer MCP server

**30 min teoría + 90 min práctica.** Externalizas las tools de NeuronBank a un MCP server.

## Instalar
```bash
npm install
npx tsx seed.ts        # crea banco.db
```

## Probar con el inspector
```bash
npx @modelcontextprotocol/inspector npx tsx server.ts
```
Invoca `movimientosPorCuenta({ cuenta: "CU-1001", mes: "2026-09" })` y observa las filas. En la Sesión 2 le agregamos guardrails.
