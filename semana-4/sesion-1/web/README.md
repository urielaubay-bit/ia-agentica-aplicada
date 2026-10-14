# Semana 4 · Sesion 1 · RAG con UI generativa (front-end)

RAG sobre **documentos reales** con interfaz web. Es el patron de UI generativa de
**Semana 2 · Sesion 2** (`useChat`, una tool = un componente) aplicado a RAG: cada
respuesta se dibuja **con sus fuentes**, citando los fragmentos que recupero del
indice.

Para poder preguntar **cualquier cosa** sobre un PDF real (un estado de cuenta de 8
hojas), el front reusa el **recuperador avanzado** de la sesion
(`../../avanzado/solucion.ts`): embeddings **multilingues** + busqueda **hibrida**
(coseno + lexico) + **chunking por ventanas** + dedup + abstencion. El basico (pura
similitud en ingles) no alcanza para una pregunta natural sobre ese PDF. El OCR lo
hace el agente (`../../ocr.ts`).

## Correr
```bash
cd semana-4/sesion-1          # primero instala el core (una vez)
npm install
cd web
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local   # el agente OCR-ea; el copiloto responde
npm install
npm run dev                   # http://localhost:3000  (corre DESDE web/)
```
La **primera** carga construye el indice una vez: baja el modelo multilingue
(~120MB) y el agente OCR-ea cada PDF de `../docs/`. El **OCR se cachea** en
`../docs/<pdf>.ocr.txt`; las siguientes cargas lo reusan (no re-OCR, no costo). El
panel izquierdo muestra el avance ("indexando..." -> "listo: N fragmentos").

> El key va en `web/.env.local` (esta app), no solo en `../.env`. Si ya existen los
> `.ocr.txt`, el OCR no se vuelve a llamar; el key sigue haciendo falta para que el
> copiloto responda.

## Que se ve
- **Izquierda (Base de conocimiento):** el pipeline (OCR, chunking por ventanas,
  embeddings, hibrido), las fuentes **listadas desde el indice** (`faq.txt`,
  `aviso-comisiones.pdf`, `estado-cuenta-neuronbank.pdf`) con su conteo, y el estado en vivo.
- **Derecha (Copiloto RAG):** el chat. Cada respuesta se **fundamenta** solo en los
  fragmentos recuperados y debajo se dibuja la tarjeta **Fragmentos recuperados**
  con el score y una insignia de origen (FAQ o PDF-OCR).

Pruebalo:
- *"Cual es el saldo promedio del estado de cuenta?"* / *"Cual es el saldo final?"*
  -> responde desde el **estado de cuenta** (via OCR + ventanas).
- *"Cuanto cuesta una SPEI menor a 100 mil?"* -> desde la **FAQ**.
- *"Que es la cuenta Premium PR-2026?"* -> solo vive en `aviso-comisiones.pdf`.
- Una pregunta fuera de la base -> el asistente **se abstiene** (el recuperador
  devuelve `null` por score bajo).

## Agregar tus propios documentos
Deja cualquier `.pdf` (o `.txt`) en `../docs/` y reinicia. El front OCR-ea cada PDF
nuevo (y lo cachea), lo mete al indice por ventanas, y ya puedes preguntarle. Para
re-OCR de uno, borra su `.ocr.txt`.

## Como se arma
| Capa | Archivo | Que hace |
|---|---|---|
| Recuperador | `../avanzado/solucion.ts` | multilingue + hibrido + ventanas + dedup; `recuperar()` (score + fuente) y abstencion. |
| OCR del agente | `../ocr.ts` | Claude con vision transcribe cada PDF. |
| Indice (glue) | `app/rag-index.ts` | OCR cacheado de todos los PDF + ingest; expone `buscar` y el estado. |
| Tool | `app/api/chat/route.ts` | `buscarEnBase` recupera fragmentos; el modelo responde SOLO con ellos. |
| Estado | `app/api/estado/route.ts` | fase del indice + conteo por fuente (para el panel). |
| Fuentes | `app/components/fuentes-card.tsx` | una tool = un componente: pinta los fragmentos citados. |
| Panel | `app/components/base-conocimiento.tsx` | pipeline, fuentes (del indice) y estado en vivo. |
| Copiloto | `app/components/copilot.tsx` | chat + `renderParte` (texto = respuesta, tool = fuentes). |

La version de **terminal** sigue igual: `npx tsx probar-rag.ts` en `..` (esa usa el
RAG basico de `rag.ts`).

## Conceptos de UI generativa (para la clase)
1. **Streaming por fases.** El indice (OCR + embeddings) y la busqueda muestran
   un esqueleto mientras corren; la UI es un flujo, no algo instantaneo.
2. **Transparencia / citas.** RAG no es una caja negra: se VEN los fragmentos
   recuperados y su score. La respuesta se puede auditar.
3. **Provenance.** Cada fragmento dice si vino de la FAQ o del PDF escaneado que
   el agente OCR-eo. Es el mismo indice, dos fuentes.
4. **Abstencion (grounding).** Si no hay contexto suficiente, el asistente lo
   dice en vez de inventar. El guardrail vive en el prompt + el score.
