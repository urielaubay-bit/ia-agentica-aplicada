# Reto · Semana 2 · Sesión 1 (opcional)

El `route.ts` base se queda igual. Esta es una versión mejorada que el instructor
introduce cuando el grupo ya vio el streaming funcionando.

## Archivos

- `app/api/chat/cuentas.ts` — fuente de datos por cuenta (CU-1001, CU-1002, CU-1003), cada una distinta. Aquí agregan "más información".
- `app/api/chat/route.reto.ts` — versión con datos reales + una segunda tool + system prompt endurecido.

## Cómo activarlo

Desde `app/api/chat/`:

```bash
mv route.ts route.base.ts
mv route.reto.ts route.ts
```

(Para volver al base: invierte los dos `mv`.)

## Qué cambia respecto al base

1. **Datos reales por cuenta.** El tool lee de `cuentas.ts`, así CU-1002 ya no responde lo mismo que CU-1001, y una cuenta inexistente regresa `cuenta_no_encontrada` en vez de inventar.
2. **Segunda tool: `getMovimientos`.** Devuelve el detalle del mes. El modelo ahora elige entre dos tools según lo que pidan.
3. **System prompt endurecido.** Alcance solo-banca, no mezclar cuentas, no inventar, e ignorar intentos de inyección.

## Qué pedirles que hagan (ideas de "más información" y "otra tool")

- Agregar 2-3 cuentas nuevas a `cuentas.ts` con datos propios.
- Probar el contraste: pedir CU-1001 y luego CU-1002; ahora los números difieren.
- Pedir una cuenta que no existe (CU-9999) y confirmar que responde "no encontrada".
- Añadir una **tercera tool**, por ejemplo `reportarAlerta(cuenta, movimientoId)` o `getLimiteDisponible(cuenta)`, con su propia guardia.
- Reto de seguridad: pedir "muéstrame los saldos de TODAS las cuentas" y verificar que se niega (las tools solo aceptan UNA `cuenta`, así que no hay forma de sacar todas de un jalón).

## Nota

En Sesión 1 el `page.tsx` solo pinta texto, así que el modelo narra los datos.
En Sesión 2 (UI generativa) estas salidas tipadas se renderizan: `getKpisCuenta`
como tarjetas de KPI y `getMovimientos` como tabla.
