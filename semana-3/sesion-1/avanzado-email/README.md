# Reto avanzado · MCP server que envía reportes por correo

Un MCP server que **genera un reporte de portafolio de NeuronBank y lo envía por
correo**. Extiende la idea de la Sesión 1 (tools tipadas sobre SQLite) con una
integración de salida real: email.

## Instalar
```bash
npm install
npx tsx seed.ts        # crea banco.db
```

## Probar con el inspector
```bash
npx @modelcontextprotocol/inspector npx tsx server.ts
```
Dos tools:
- `generarReportePortafolio({ cuenta: "CU-1001" })` — compone el reporte (saldo, resumen por tipo, movimientos). **No envía.**
- `enviarReportePortafolio({ cuenta: "CU-1001", email: "cliente@ejemplo.com" })` — compone y **envía** el reporte.

## Envío de correo (transporte intercambiable)

- **Por defecto (sin configurar nada):** usa una cuenta de prueba de **Ethereal**.
  El correo se "envía" de verdad por SMTP pero no llega a un inbox real; la
  respuesta trae una `previewUrl` para ver el correo renderizado. Ideal para demo.
- **Correo real:** define variables de entorno SMTP y el mismo código entrega de verdad:

```bash
export SMTP_HOST=smtp.gmail.com         # o email-smtp.us-east-1.amazonaws.com (SES)
export SMTP_PORT=587
export SMTP_USER=tu_usuario
export SMTP_PASS=tu_app_password        # Gmail: App Password (no tu contraseña)
export SMTP_FROM="NeuronBank <no-reply@tudominio.com>"
npx @modelcontextprotocol/inspector npx tsx server.ts
```

> Las credenciales van en variables de entorno / un vault, **nunca** en el código
> ni en el repo.

## Resultado esperado

`enviarReportePortafolio({ cuenta: "CU-1001", email: "..." })` devuelve:
```json
{ "ok": true, "cuenta": "CU-1001", "saldo": 25950, "messageId": "...",
  "previewUrl": "https://ethereal.email/message/...", "mode": "ethereal (demo)" }
```
Abre `previewUrl` para ver el reporte (saldo, resumen por tipo y movimientos).
