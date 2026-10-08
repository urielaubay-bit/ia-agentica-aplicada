# Reto avanzado — RAG que no alucina

**Semana 4 · Sesión 1.** El RAG base (`rag.ts`) recupera los *k* fragmentos más
parecidos... siempre. Si preguntas algo que **no** está en los documentos, igual
te devuelve los 3 "menos malos", y un LLM los usará para inventar. Aquí conviertes
ese recuperador ingenuo en uno con guardrails, y lo **mides**.

Trabajas sobre la misma base de NeuronBank (`docs/faq.txt`). Corre todo desde
`semana-4/sesion-1`:

```bash
npm install                 # si no lo hiciste aún
npx tsx avanzado/eval.ts    # mide tu recuperador (1a vez baja un modelo multilingüe ~120MB)
```

`avanzado/eval.ts` es tu prueba: implementa los TODO de `avanzado/rag-avanzado.ts`
hasta que diga **PASA**. Meta: **hit@3 ≥ 5/6** y **abstención correcta**.

> **El modelo importa.** Este reto ya trae un modelo de embeddings *multilingüe*
> (`paraphrase-multilingual-MiniLM-L12-v2`), no el inglés de `rag.ts`. Con el inglés,
> una pregunta fuera de alcance marcaba ~0.42 de coseno (más que una pregunta real de
> SPEI) y **ningún umbral servía**; con el multilingüe cae a ~0.1 y la abstención
> funciona. Lección: en español, el modelo de embeddings es media solución.

## Parte 1 — Puntajes y abstención (anti-alucinación)
Hoy `retrieve` devuelve texto sin puntaje y nunca dice "no sé".
- Haz que `recuperar` devuelva `Hit[] = { text, score, fuente }`.
- Si el mejor `score` queda por debajo de `UMBRAL`, devuelve `null` (abstención).

**Por qué importa:** la causa #1 de alucinación en RAG es recuperar ruido para una
pregunta fuera de alcance. Un umbral lo corta de raíz.

## Parte 2 — Búsqueda híbrida (léxica + semántica)
Los embeddings entienden significado pero fallan con tokens exactos: `CU-1001`,
`800-NEURON`, `CAT`, `$100,000`.
- Implementa `scoreLexico(query, texto)` (0..1, solapamiento de términos).
- Fusiona: `score = ALPHA * coseno + (1 - ALPHA) * léxico`.

**Por qué importa:** casi todo sistema RAG serio combina vectorial + léxico; cada
uno rescata lo que el otro pierde. Pruébalo: la pregunta de `CU-1001` salta con lo
léxico.

## Parte 3 — Mídelo y compáralo
`eval.ts` ya corre 6 preguntas con su respuesta esperada + 1 pregunta fuera de
alcance que **debe** abstenerse. Ajusta `UMBRAL` y `ALPHA` hasta pasar. Luego, para
sentir el salto, comenta la parte léxica (deja solo coseno) y vuelve a correr: vas
a ver bajar el hit@3 y/o perderse la abstención.

## Reto extra — Respuesta citada (previo a la Sesión 2)
Con el AI SDK, redacta la respuesta **solo** con los fragmentos recuperados:

```ts
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
// ...
const { text } = await generateText({
  model: anthropic("claude-sonnet-4-5"),
  system: "Responde SOLO con el contexto numerado. Cita la fuente como [1], [2]. " +
          "Si el contexto no alcanza, di: 'No tengo esa información.'",
  prompt: `Contexto:\n${hits.map((h, i) => `[${i + 1}] ${h.text}`).join("\n")}\n\nPregunta: ${q}`,
});
```

Si `recuperar` devolvió `null`, ni siquiera llames al modelo: responde la frase de
"no tengo esa información". (La generación completa, dentro de un bot de Telegram,
es la Sesión 2.)

## Otras ideas (si vas rápido)
- **Chunking con solapamiento** para documentos de prosa larga: ventanas de ~400
  caracteres que se solapan ~80, en vez de partir por párrafo (añade tu propio
  `docs/politica.txt` para notar la diferencia).
- **MMR** (relevancia + diversidad) para que los *k* fragmentos no sean casi el mismo.
- **Re-ranking**: recupera top-10 por vector y reordénalos combinando señales.

Solución de referencia: `avanzado/solucion.ts`.
