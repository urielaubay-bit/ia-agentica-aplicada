# Semana 4 · Sesión 2 · Bot de Telegram con RAG (patrón CAaaS)

**30 min teoría + 90 min práctica.** Tu agente en un canal real, grounded en tus docs, con control de acceso.

## Setup
1. Crea tu bot en Telegram con **@BotFather** (`/newbot`) y copia el token.
2. Exporta el token en tu terminal (tu `ANTHROPIC_API_KEY` ya está configurada del día 1):
   ```bash
   export BOT_TOKEN=...          # el de @BotFather
   export ALLOWED_IDS=           # opcional: tu id de Telegram (via @userinfobot)
   ```
3. Pon tus documentos en `docs/*.txt`.

## Correr
```bash
npm install
npx tsx bot.ts
```
Escríbele a tu bot en Telegram. Responde desde tus documentos. Para el control de acceso, exporta tu id (via @userinfobot) en `ALLOWED_IDS` y reinicia.
