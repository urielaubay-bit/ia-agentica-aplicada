# Semana 1 · Sesión 1 · El loop agéntico

**30 min teoría + 90 min práctica.** Construyes un agente que razona, llama a una tool tipada y ejecuta el loop agéntico.

## Instalar
```bash
cp .env.example .env   # pon tu ANTHROPIC_API_KEY
npm install
```

## Pasos
- `npx tsx --env-file=.env paso1.ts` — una generación simple (el LLM puede fallar la aritmética).
- `paso2.ts` — una tool tipada con Zod (se usa desde paso3).
- `npx tsx --env-file=.env paso3.ts` — el loop agéntico: el modelo usa la tool. Espera `Pasos: >= 2` y el resultado correcto (5446 / 6446).

## Verificación
El modelo usa la `calculadora` en vez de inventar el resultado.
