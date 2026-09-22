# Semana 5 · Sesión 1 · Evals

**30 min teoría + 90 min práctica.** Mides si tu agente funciona, no solo si "se ve bien".

## Correr los evals
```bash
npm install
npm test
```
Incluye validez de schema (`reporteCuenta`) y groundedness sobre la base de NeuronBank (comisión SPEI, reportar fraude). El tercer tipo, LLM-as-judge, usa un modelo barato (ej. Haiku) para calificar 1 a 5. Regla: 5 evals que pasan antes de pasar a producción. Reemplaza `miAgente` por tu agente real de NeuronBank.
