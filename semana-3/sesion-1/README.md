# Semana 3 · Sesión 1 · Tu primer MCP server

**30 min teoría + 90 min práctica.** Externalizas tus tools a un MCP server.

## Instalar
```bash
npm install
npx tsx seed.ts        # crea ventas.db
```

## Probar con el inspector
```bash
npx @modelcontextprotocol/inspector npx tsx server.ts
```
Invoca `ventasPorCanal({ mes: "2026-07" })` y observa las filas. En la Sesión 2 le agregamos guardrails.
