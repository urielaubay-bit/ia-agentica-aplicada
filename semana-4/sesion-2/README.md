# Semana 4 · Sesión 2 · Bot de Telegram con RAG (patrón CAaaS)

**30 min teoría + 90 min práctica.** Tu agente en un canal real, grounded en tus docs, con control de acceso.

## Setup
1. Crea tu bot en Telegram con **@BotFather** (`/newbot`) y copia el token.
2. Configura el token (tu `ANTHROPIC_API_KEY` ya está lista del día 1):
   - **Windows (PowerShell):** `setx BOT_TOKEN "..."` (y `setx ALLOWED_IDS "tu-id"` opcional), luego abre una terminal nueva.
   - **Mac / Linux:** `export BOT_TOKEN=...` (y `export ALLOWED_IDS=tu-id` opcional).
3. Pon tus documentos en `docs/*.txt`.

## Correr
```bash
npm install
npx tsx bot.ts
```
Escríbele a tu bot en Telegram. Responde desde tus documentos. Para el control de acceso, exporta tu id (via @userinfobot) en `ALLOWED_IDS` y reinicia.
