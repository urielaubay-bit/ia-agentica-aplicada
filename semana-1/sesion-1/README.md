# Semana 1 · Sesión 1 · El loop agéntico

**30 min teoría + 90 min práctica.** Construyes el agente base de **NeuronBank**: razona, llama a una tool tipada de solo lectura y ejecuta el loop agéntico.

## Instalar
```bash
npm install
```

## Pasos
- `npx tsx paso1.ts` — generación simple: le pides el saldo de CU-1001 sin tools; el modelo no tiene el dato (se niega o lo inventa).
- `paso2.ts` — la tool tipada `consultarSaldo` con Zod (se usa desde paso3).
- `npx tsx paso3.ts` — el loop agéntico: el modelo encadena `consultarSaldo` + `listarMovimientos`. Espera `Pasos: >= 2` y el saldo real de CU-1001 (18450).

## Verificación
El modelo usa las tools (dato real del core) en vez de inventar el saldo o los movimientos.

## Reto avanzado
`avanzado-banca/` — el mismo asistente de NeuronBank con varias tools, un guardrail de negocio (`validarTransferencia`) y structured output. Córrelo con `npx tsx banca.ts`.
