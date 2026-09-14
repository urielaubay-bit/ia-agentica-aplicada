# Semana 2 · Sesión 2 · UI generativa

**30 min teoría + 90 min práctica.** La salida de una tool se renderiza como un componente.

## Instalar y correr
```bash
cp .env.example .env.local
npm install
npm run dev
```

Prueba: "Muéstrame los KPIs del último mes". El asistente transmite texto **y** renderiza las tarjetas de KPI (`kpi-cards.tsx`). Ese es el patrón de UI generativa: una tool por tipo de respuesta, un componente por tool.
