# Semana 1 · Sesión 2 · Structured output (agente NeuronBank)

**30 min teoría + 90 min práctica.** Obtienes JSON validado con `generateObject` y armas el **baseline del agente de NeuronBank** que evoluciona 5 semanas.

## Instalar
```bash
npm install
```

## Pasos
- `npx tsx alucinacion.ts` — arranca viendo el problema: `generateObject` obliga a llenar una ficha (SPEI rechazadas, %) “citada” del Informe Anual Banxico 2023. Correlo dos veces: los números cambian porque la tabla no existe.
- `npx tsx paso4.ts` — `reporteCuenta` validado (titular, cuenta, saldo, alertas, recomendaciones) para una cuenta de NeuronBank.
- `npx tsx banca-baseline.ts` — el baseline completo: tool tipada + schema + loop. Este es el proyecto que evoluciona 5 semanas.

## El proyecto del curso
Todo el curso construye **el agente de NeuronBank**: hoy tool tipada + structured output; luego UI generativa (S2), MCP + guardrails (S3), Telegram + RAG (S4) y producción (S5). La forma `reporteCuenta` es la que en la Semana 2 renderizas como UI.
