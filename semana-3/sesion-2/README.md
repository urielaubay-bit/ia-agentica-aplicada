# Semana 3 · Sesión 2 · Guardrails y scoping por rol

**30 min teoría + 90 min práctica.** Guardrails reales: solo lectura y scoping por rol forzado en el server.

## Instalar
```bash
npm install
npx tsx seed.ts
```

## Probar el guardrail de rol
```bash
npx @modelcontextprotocol/inspector npx tsx server.ts
```
- `ventasPorCanal({mes:"2026-07"})` devuelve las filas de julio.
- Ahora corre `CANAL=email npx tsx server.ts`: aunque pidas `paid_search`, solo devuelve email. El modelo no puede saltarse el scoping.
