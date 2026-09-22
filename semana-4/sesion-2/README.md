# Semana 4 · Sesión 2 · Bot de Telegram con RAG (patrón CAaaS)

**30 min teoría + 90 min práctica.** El asistente de NeuronBank en un canal real (Telegram), grounded en la base de conocimiento del banco, con control de acceso.

## Setup
1. Crea tu bot en Telegram con **@BotFather** (`/newbot`) y copia el token.
2. Configura el token (tu `ANTHROPIC_API_KEY` ya está lista del día 1):
   - **Windows (PowerShell):** `setx BOT_TOKEN "..."` (y `setx ALLOWED_IDS "tu-id"` opcional), luego abre una terminal nueva.
   - **Mac / Linux:** `export BOT_TOKEN=...` (y `export ALLOWED_IDS=tu-id` opcional).
3. La base de conocimiento de NeuronBank está en `docs/faq.txt` (edítala o agrega más `.txt`).

## Correr
```bash
npm install
npx tsx bot.ts
```
Escríbele a tu bot en Telegram (ej. "¿cuánto cuesta un SPEI?"). Responde desde la base de NeuronBank. Para el control de acceso, exporta tu id (via @userinfobot) en `ALLOWED_IDS` y reinicia.
