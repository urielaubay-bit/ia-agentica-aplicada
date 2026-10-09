# Semana 4 · Sesion 1 · RAG con UI generativa (front-end)

El **mismo RAG** de la sesion (local, embeddings on-device, OCR del PDF escaneado),
ahora con una interfaz web. Es el patron de UI generativa de **Semana 2 · Sesion 2**
(`useChat`, una tool = un componente) aplicado a RAG: cada respuesta se dibuja
**con sus fuentes**, citando los fragmentos que recupero del indice.

No reescribe nada del RAG: `app/rag-index.ts` **importa tal cual** `../../rag.ts`
(chunking + embeddings + recuperacion) y `../../ocr.ts` (el agente OCR-ea el PDF).
La web solo los consume.

## Correr
```bash
cd semana-4/sesion-1          # primero instala el core (una vez)
npm install
cd web
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local   # Claude hace el OCR y responde
npm install
npm run dev                   # http://localhost:3000  (corre DESDE web/)
```
La **primera** pregunta construye el indice una sola vez: baja el modelo de
embeddings (~25MB) y el agente hace OCR del PDF escaneado. El panel izquierdo
muestra ese avance ("indexando..." -> "listo: N fragmentos").

## Que se ve
- **Izquierda (Base de conocimiento):** el pipeline (chunking, OCR, embeddings),
  las dos fuentes (`faq.txt` y el PDF escaneado `aviso-comisiones.pdf`) y el
  estado del indice en vivo.
- **Derecha (Copiloto RAG):** el chat. Cada respuesta se **fundamenta** solo en
  los fragmentos recuperados y debajo se dibuja la tarjeta **Fragmentos
  recuperados** con el score de similitud y una insignia de origen (FAQ o
  PDF-OCR).

Pruebalo con los chips:
- *"Cuanto cuesta una SPEI menor a 100 mil?"* -> responde desde la **FAQ**.
- *"Que es la cuenta Premium PR-2026?"* / *"SPEI mayor a 100 mil"* -> solo viven
  en el **PDF escaneado** (via OCR), no en `faq.txt`.
- Una pregunta fuera de la base -> el asistente **se abstiene** ("No tengo esa
  informacion"), porque el score es bajo.

## Como se arma (las costuras del RAG a la vista)
| Capa | Archivo | Que hace |
|---|---|---|
| Core RAG | `../rag.ts` | chunking, embeddings locales, `buscar()` (score + fuente), `retrieve()`. |
| OCR del agente | `../ocr.ts` | Claude con vision transcribe el PDF escaneado. |
| Indice (glue) | `app/rag-index.ts` | construye el indice UNA vez (FAQ + OCR) y expone `buscar`. |
| Tool | `app/api/chat/route.ts` | `buscarEnBase` recupera fragmentos; el modelo responde SOLO con ellos. |
| Estado | `app/api/estado/route.ts` | fase del indice + conteo por fuente (para el panel). |
| Fuentes | `app/components/fuentes-card.tsx` | una tool = un componente: pinta los fragmentos citados. |
| Panel | `app/components/base-conocimiento.tsx` | pipeline, fuentes y estado en vivo. |
| Copiloto | `app/components/copilot.tsx` | chat + `renderParte` (texto = respuesta, tool = fuentes). |

La version de **terminal** sigue igual: `npx tsx probar-rag.ts` en `..`.

## Conceptos de UI generativa (para la clase)
1. **Streaming por fases.** El indice (OCR + embeddings) y la busqueda muestran
   un esqueleto mientras corren; la UI es un flujo, no algo instantaneo.
2. **Transparencia / citas.** RAG no es una caja negra: se VEN los fragmentos
   recuperados y su score. La respuesta se puede auditar.
3. **Provenance.** Cada fragmento dice si vino de la FAQ o del PDF escaneado que
   el agente OCR-eo. Es el mismo indice, dos fuentes.
4. **Abstencion (grounding).** Si no hay contexto suficiente, el asistente lo
   dice en vez de inventar. El guardrail vive en el prompt + el score.
