# Semana 4 · Sesión 1 · RAG local (embeddings on-device)

**30 min teoría + 90 min práctica.** Chunking, embeddings locales, recuperación por similitud. Sin nube.

## Instalar y probar
```bash
npm install
npx tsx probar-rag.ts   # la 1a vez descarga el modelo de embeddings (~25MB)
```
`docs/faq.txt` trae la base de conocimiento de NeuronBank (comisión SPEI, límites, crédito, fraude, horarios, tasas). En la Sesión 2 conectamos esto a un bot de Telegram.

## RAG sobre un PDF escaneado (el agente hace OCR)

`docs/aviso-comisiones.pdf` es un PDF **escaneado** (solo imagen, sin capa de texto),
así que no se puede leer con `readFileSync`. `probar-rag.ts` hace que **Claude lo lea
con visión (OCR)** y mete ese texto al mismo índice RAG:

```
ingest("docs")            # los .txt (la FAQ)
ocrPdf("...aviso.pdf")    # Claude transcribe el PDF escaneado  (ocr.ts)
ingestTexto(texto, ...)   # el texto OCR-eado entra al índice    (rag.ts)
```

Las últimas preguntas de `probar-rag.ts` (SPEI > $100,000, cuenta Premium `PR-2026`)
**solo** se responden con lo que salió del PDF, no están en `faq.txt`.

Necesitas tu llave en `.env`:
```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
npx tsx probar-rag.ts
```
**Por qué importa:** los documentos reales son PDFs y escaneos. Un LLM con visión es
el "OCR" más simple y robusto, y su salida alimenta el mismo pipeline de RAG.

## Front-end con UI generativa (`web/`)
El mismo RAG (embeddings locales + OCR del PDF escaneado) con una interfaz web,
reusando el patrón de UI generativa de Semana 2 · Sesión 2 (`useChat`, una tool =
un componente). Cada respuesta llega **citando los fragmentos** que recuperó, con
su score y su fuente (FAQ o PDF-OCR). No reescribe el RAG: `web/app/rag-index.ts`
importa tal cual `rag.ts` y `ocr.ts`. Ver `web/README.md`.
```bash
cd web && npm install && npm run dev   # http://localhost:3000
```

## Reto avanzado
Para ir más allá (búsqueda híbrida, abstención, evaluación), ver `avanzado/README.md`.
