# Semana 5 · Sesión 2 · Observabilidad, costo y capstone

**30 min teoría + 90 min práctica.** La última sesión del curso: tu agente deja
de ser un demo y se vuelve un producto que puedes medir, cotizar y vender.

Hoy no construyes un agente nuevo. Tomas el **copiloto web de NeuronBank** (el
de Semana 2, con su UI generativa) y le pones las tres cosas que lo separan de
producción: **trazas, costo y evidencia de que no se rompe en silencio.**

---

## Qué hay en esta carpeta

| Parte | Qué corres | Qué aprendes |
|---|---|---|
| 1. Medir una llamada | `npm run obs` | Latencia, tokens, cache y **costo** de un solo turno |
| 2. Las dos palancas de costo | `npm run costo` | Prompt caching, el invalidador silencioso, dos niveles de modelo |
| 3. El producto completo | `cd web && npm run dev` | El copiloto de NeuronBank con panel de observabilidad y LangSmith |
| 4. Capstone | leer, no correr | El agente que escribe y **repara su propio código** |

Setup: tu `ANTHROPIC_API_KEY` ya está en el entorno desde el día 1
([SETUP.md](../../SETUP.md)). LangSmith es **opcional** y se explica abajo.

---

## Parte 1 · Medir una llamada (15 min)

```bash
npm install
npm run obs
```

Salida (ejemplo real):

```text
modelo:        claude-sonnet-5-5
latencia_ms:   2422
tokens:        { entrada: 46, salida: 118, cacheLeido: 0, cacheEscrito: 0 }
costo:         $0.0013 USD  ($0.02 MXN)
por 1,000:     $1.2720 USD  ($23.53 MXN)
```

Cuatro números. Si no puedes decir estos cuatro de tu agente, no está listo,
por bonito que se vea el demo.

Fíjate en que `cacheLeido` y `cacheEscrito` salen en **cero**. No es un bug: el
system prompt de ese script tiene 10 tokens y el **mínimo cacheable** del
modelo son 512. El cache no falla, simplemente **no aplica**, y nadie te avisa.

---

## Parte 2 · Las dos palancas de costo (20 min)

```bash
npm run costo
```

Tres experimentos medidos en vivo, con el manual de políticas de NeuronBank
(~2,700 tokens) como prefijo:

**A) Prompt caching.** Tres llamadas idénticas. La primera **escribe** el cache
(cuesta 1.25x), las siguientes lo **leen** (cuestan 0.1x). Medido el
2026-10-22: `$0.0131` con cache contra `$0.0329` sin él, **60% menos**.

**B) El invalidador silencioso.** La misma llamada, pero con una fecha dentro
del prefijo. `cache leído = 0` en todas: cada llamada escribe de nuevo y
ninguna lee. Queda **más caro que no cachear**, y no hay ni un error que te
avise. Un reloj, un id de sesión o el nombre del usuario en el prefijo se come
el ahorro completo.

**C) Dos niveles de modelo.** La misma pregunta a los dos modelos. Entrada a
`$2.00/MTok` contra `$0.10/MTok`: en caliente el barato cuesta **22x menos**.

> **La regla:** prefijo estable primero (caching), modelo barato después. En
> ese orden, porque el caching no sacrifica calidad y cambiar de modelo sí
> puede.

### El mínimo cacheable, la trampa que casi nos tumba la clase

El cache tiene un mínimo de prefijo por modelo. Por debajo de él **no se
cachea, sin error ni aviso**. Medido con este mismo prefijo el 2026-10-22:

| Modelo | Mínimo | ¿Cachea un prefijo de ~4,000 tokens? |
|---|---:|---|
| `claude-sonnet-5-5`, `claude-haiku-5-5` | 512 | sí las dos |
| `claude-sonnet-4-5` | 1,024 | sí |
| `claude-haiku-4-5` | 4,096 | **no** |

Por eso esta sesión usa los modelos 5.5 por defecto: con Haiku 4.5 el panel
mostraba `cache = 0` y el ahorro no aparecía nunca. Si tu agente no muestra
lecturas de cache, revisa el mínimo **antes** de revisar tu código.

---

## Parte 3 · El producto completo: NeuronBank web (40 min)

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

Es el copiloto de Semana 2 (dashboard + UI generativa, una tool por tarjeta) con
tres cosas nuevas. Ver [web/README.md](web/README.md) para el detalle.

### 1. Panel de observabilidad, sin cuenta en ningún servicio

Debajo del dashboard aparece **Observabilidad y costo**. Pregúntale algo al
copiloto y cada turno se registra con:

- **tokens** de entrada, salida y cache (leído y escrito),
- **latencia** del turno y p50 de la sesión,
- **tools** que se llamaron y cuántos pasos dio el loop,
- **costo** en USD y MXN, y el costo **por 1,000 consultas**,
- los **fallos**, en rojo (haz clic en cualquier fila para ver el desglose).

Esa última cifra es la que le dices a un cliente. No "usa IA": *"mil consultas
te cuestan esto"*.

### 2. Prompt caching sobre el manual del banco

El system prompt ya no son tres líneas: es
[`web/app/lib/politicas.ts`](web/app/lib/politicas.ts), el manual de operación
de NeuronBank (comisiones, límites, fraude, privacidad, tono). Está marcado como
cacheable y es **byte-estable**: nada de fechas ni ids ahí dentro. Lo que varía
(la pregunta) va después. Desde el segundo turno verás miles de tokens en la
columna *Cache*.

### 3. Router de dos niveles

Antes de responder, un modelo barato clasifica la pregunta (`simple` /
`complejo`) y elige quién la atiende. Haz clic en una fila del panel y verás su
decisión y su motivo.

Cuesta ~$0.0001 por turno y **falla abierta**: si el router truena, responde el
modelo caro. Un ahorro nunca vale una caída. Pero suma ~1s de latencia a cada
turno: el panel te muestra las dos caras para que decidas con números.

Apágalo y compara:

```bash
ROUTER=off npm run dev
```

### LangSmith (opcional pero recomendado)

El panel es tu observabilidad local. **LangSmith** es la de producción: trazas
persistentes, por usuario, con el historial completo de cada tool.

1. Crea una cuenta gratis en https://smith.langchain.com y saca una API key.
2. Exporta tres variables y levanta la app:

```bash
export LANGSMITH_TRACING=true
export LANGSMITH_API_KEY=lsv2_pt_...
export LANGSMITH_PROJECT=neuronbank-tu-nombre
npm run dev
```

(En Windows, `setx` y terminal nueva, igual que la `ANTHROPIC_API_KEY`.)

El badge del panel pasa de *LangSmith apagado* a *LangSmith · tu-proyecto*, y
cada turno aparece en el dashboard de LangSmith con el árbol completo: router →
copiloto → cada tool, con entradas, salidas, tokens y latencia.

Son **tres líneas** de código, en `web/app/api/chat/route.ts`:

```ts
const LANGSMITH = process.env.LANGSMITH_TRACING === "true" && !!process.env.LANGSMITH_API_KEY;
const { streamText, generateObject } = LANGSMITH ? wrapAISDK(ai) : ai;
```

Si no hay clave, el SDK va sin envolver y la app corre igual. **Tu
observabilidad nunca debe depender de un servicio externo.**

> `wrapAISDK` es el camino correcto para AI SDK v5 y v6. El `LangSmithTelemetry`
> que verás en algunos blogs es solo para AI SDK v7.

---

## Parte 4 · Capstone: agentes que se reparan (15 min)

El patrón más avanzado del curso, para leer y entender:

```text
spec → Plan → Generate → Validate (tsc + tests) → Repair → app corriendo
        (tareas    (escribe     (corre las          (mete el error
         ordenadas) archivos)    herramientas)       real de vuelta)
```

Tres ideas que te llevas:

1. **El agente confía en herramientas, no en su opinión.** `tsc --noEmit` y los
   tests son la fuente de verdad. Los evals de la sesión pasada **son** esos
   tests.
2. **El loop de reparación:** ante un fallo le devuelves el error exacto y los
   archivos en juego, acotado a N intentos.
3. **Structured output para planear:** el planner emite un `Task[]` validado con
   `dependsOn` y se ordena topológicamente. Cero errores de parseo.

Costo real de una corrida completa: **~$0.62** (12 llamadas, 1 reparación que
disparó y funcionó). Referencia: el repo "Car Inventory Agent".

Hoy mismo hiciste una versión chica de esto: el bug de `cacheCreationInputTokens`
en `route.ts` se encontró **porque el panel mostraba un cero imposible**. La
observabilidad es lo que hace posible repararse.

---

## Proyecto final (25 min)

Presenta en **5 minutos**:

1. **El problema** (30 s): qué dolor real resuelve.
2. **Demo en vivo** (2 min): tu agente funcionando.
3. **Arquitectura** (1 min): agentes, tools, datos, canal.
4. **Evals** (30 s): cómo sabes que funciona (Sesión 1).
5. **Del POC al producto** (1 min): observabilidad, costo **por 1,000
   consultas**, y qué falta para venderlo.

Rúbrica completa en el Cuaderno del Participante.

---

## Checklist de producción (llévatelo)

- [ ] Puedo ver **trazas** por turno: entrada, salida, tools, latencia.
- [ ] Puedo decir el **costo por 1,000 consultas** de mi agente.
- [ ] El **prefijo** de mi prompt es estable y supera el mínimo cacheable.
- [ ] Uso **modelo barato** donde no se necesita el caro.
- [ ] Mis **fallos quedan registrados** y cada uno se vuelve un eval.
- [ ] Tengo **5 evals verdes** (Sesión 1).
- [ ] Mi agente **no ejecuta** operaciones de dinero sin confirmación humana.
