# Semana 5 · Sesión 1 · Evals

**30 min teoría + 90 min práctica.** Mides si tu agente funciona, no solo si "se ve bien".

## Correr los evals
```bash
npm install
npm test
```
Incluye validez de schema (determinista) y groundedness (determinista). El tercer tipo, LLM-as-judge, usa un modelo barato (ej. Haiku) para calificar 1 a 5. Regla: 5 evals que pasan antes de mostrar a un cliente. Reemplaza `miAgente` por tu agente real.
