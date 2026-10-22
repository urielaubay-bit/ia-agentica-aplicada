# NeuronBank web · del demo al producto

El copiloto de **Semana 2 · Sesión 2** (dashboard + UI generativa) con lo que le
faltaba para producción: **observabilidad, costo y fallos visibles.**

```bash
npm install
npm run dev        # http://localhost:3000
```

Con Langfuse (opcional):

```bash
export LANGFUSE_PUBLIC_KEY=pk-lf-...
export LANGFUSE_SECRET_KEY=sk-lf-...
export LANGFUSE_BASEURL=https://us.cloud.langfuse.com   # o la de Europa
npm run dev
```

**Cuidado con el nombre:** es `LANGFUSE_BASEURL`, sin guion bajo entre BASE y
URL. Con `LANGFUSE_BASE_URL` el exporter no la ve, se va al default de Europa y
las trazas no llegan sin ningun error. `LANGFUSE_DEBUG=true` imprime cada lote.

## Qué cambió respecto a Semana 2

Las tools son **las mismas siete**. Lo nuevo son cuatro archivos:

| Archivo | Qué hace |
|---|---|
| `app/lib/politicas.ts` | El manual de NeuronBank: el **prefijo estable** que se cachea (~2,700 tokens) |
| `app/lib/precios.ts` | Tabla de precios y la aritmética de costo. **El único archivo que editas** si cambian los precios |
| `app/lib/trazas.ts` | Almacén de trazas en memoria: una fila por turno |
| `app/components/observabilidad-panel.tsx` | El panel que lo muestra, debajo del dashboard |
| `app/lib/vendor.ts` | Que servicio de trazas esta encendido, decidido por las claves del entorno |
| `instrumentation.ts` | Donde se registra OpenTelemetry para Langfuse. Next lo llama una vez al arrancar |

Y en `app/api/chat/route.ts`, tres bloques marcados con comentarios: el servicio
de trazas (Langfuse por `experimental_telemetry`, LangSmith por `wrapAISDK`), el
router de dos niveles y el `onFinish` que mide.

## Variables de entorno

| Variable | Default | Para qué |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Requerida |
| `MODELO_RAZONA` | `claude-sonnet-5-5` | El modelo que razona |
| `MODELO_VOLUMEN` | `claude-haiku-5-5` | El barato: router y consultas simples |
| `ROUTER` | encendido | `ROUTER=off` manda todo al modelo caro |
| `LANGFUSE_PUBLIC_KEY` | — | `pk-lf-...` de tu proyecto de Langfuse |
| `LANGFUSE_SECRET_KEY` | — | `sk-lf-...` del mismo proyecto |
| `LANGFUSE_BASEURL` | nube de Europa | **Sin guion bajo entre BASE y URL.** Pon la region de tu proyecto |
| `LANGFUSE_DEBUG` | — | `true` imprime cada lote de spans que sale |
| `LANGSMITH_TRACING` | — | `true` para trazar con LangSmith en vez de Langfuse |
| `LANGSMITH_API_KEY` | — | Tu clave de smith.langchain.com |
| `LANGSMITH_PROJECT` | `default` | Nombre del proyecto en LangSmith |

Pruébalas en vivo y mira el panel moverse:

```bash
ROUTER=off npm run dev                              # sin router: todo al caro
MODELO_RAZONA=claude-haiku-4-5 npm run dev          # el cache deja de aparecer (minimo 4,096)
```

## Experimentos para la clase

1. **El cache.** Pregunta tres veces seguidas algo de políticas (*"cuánto cuesta
   un SPEI"*, *"y el retiro en otra red"*, *"horario de sucursal"*). La columna
   *Cache* pasa de `-` a miles de tokens y el costo por turno cae.
2. **Rompe el cache.** Agrega `\nHoy es ${new Date().toISOString()}` al final de
   `SISTEMA` en `route.ts`. El ahorro desaparece y **ningún error aparece**.
   Quítalo después.
3. **El router.** Pregunta algo simple y algo complejo, y abre las dos filas del
   panel: verás `haiku` contra `sonnet` y la razón de la decisión.
4. **La abstención.** Pide *"KPIs de la cuenta CU-9999"*. El copiloto responde
   *"no tengo información de esa cuenta"* y **ni siquiera llama a la tool**: lo
   decide el manual (secciones 5.1 y 5.2, la misma respuesta para una cuenta
   ajena y una inexistente, para no confirmar si existe). El panel lo muestra con
   la columna *Tools* vacía. Ese es el prefijo cacheado haciendo trabajo real, y
   es el eval de abstención de la Sesión 1.
5. **Un fallo de verdad.** Levanta la app con un modelo que no existe y pregunta
   cualquier cosa:

   ```bash
   MODELO_RAZONA=claude-no-existe-5 npm run dev
   ```

   La fila sale en rojo con el error exacto (`model: claude-no-existe-5`) y el
   contador de errores sube. **Un fallo que no se registra no existe**, y lo que
   no existe no se arregla.

## Límites honestos (dilos si presentas esto)

- El badge dice **solo trazas locales** cuando no hay claves de ningun
  proveedor. No es un error: es el estado por default y la app funciona completa.
- Las trazas del panel viven **en RAM del proceso**: se borran al reiniciar y con varias
  instancias cada una tendría las suyas. En producción es una tabla o un
  servicio de trazas. LangSmith es justamente eso.
- El panel hace **polling cada 2 s**. Suficiente para una clase, no para un
  monitor serio.
- El **tipo de cambio** es una constante (`USD_MXN` en `precios.ts`), no un
  servicio de FX.
- Los precios están **verificados al 2026-10-22**. Cambian: revísalos.
- El costo del turno se mide desde el servidor. **No incluye** el tiempo que
  tarda el navegador en pintar las tarjetas.
