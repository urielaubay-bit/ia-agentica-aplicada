# Semana 4 · Sesión 2 · Bot de Telegram con RAG (patrón CAaaS)

**30 min teoría + 90 min práctica.** Tu agente en un canal real, grounded en tus docs, con control de acceso.

## Setup
1. Crea tu bot en Telegram con **@BotFather** (`/newbot`) y copia el token.
2. `cp .env.example .env` y pon `ANTHROPIC_API_KEY` y `BOT_TOKEN`.
3. Pon tus documentos en `docs/*.txt`.

## Correr
```bash
npm install
npx tsx --env-file=.env bot.ts
```
Escríbele a tu bot en Telegram. Responde desde tus documentos. Para el control de acceso, pon tu id (via @userinfobot) en `ALLOWED_IDS` y reinicia.
