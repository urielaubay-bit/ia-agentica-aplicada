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
- `movimientosPorCuenta({cuenta:"CU-1001", mes:"2026-09"})` devuelve los movimientos de CU-1001.
- Ahora corre `CUENTA=CU-1001 npx tsx server.ts` (rol "cajero" con una sola cuenta asignada): aunque pidas `CU-1002`, solo devuelve CU-1001. El modelo no puede saltarse el scoping.
