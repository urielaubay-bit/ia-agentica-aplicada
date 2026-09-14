# Semana 5 · Sesión 2 · Observabilidad, costo y capstone

**30 min teoría + 90 min práctica.** Del demo al producto, y el proyecto final.

## Observabilidad y costo
```bash
npm install
npx tsx observabilidad.ts
```
Mide tokens y latencia por llamada. Palancas de costo: **prompt caching** (prefijo estable) y **dos niveles de modelo**.

## Capstone: agentes que se reparan
El patrón más avanzado del curso: `spec -> plan -> generate -> validate (tsc + tests) -> repair`. El agente confía en el compilador y los tests como fuente de verdad y se corrige con el error real. Referencia: el repo "Car Inventory Agent". Costo real de una corrida completa: ~$0.62.

## Proyecto final
Presenta en 5 minutos: problema, demo en vivo, arquitectura, evals, y del POC al producto. Ver la rúbrica en el Cuaderno del Participante.
