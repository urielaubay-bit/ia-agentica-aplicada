import "dotenv/config";
import { ingest, ingestTexto, retrieve } from "./rag.ts";
import { ocrPdf } from "./ocr.ts";

// 1. Base de conocimiento en texto (la FAQ de NeuronBank).
await ingest("docs");

// 2. El agente hace OCR de un PDF ESCANEADO (sin capa de texto) y lo mete al RAG.
//    Necesitas ANTHROPIC_API_KEY en .env (Claude hace el OCR con vision).
console.log("\nOCR del PDF escaneado (Claude lo lee)...");
const texto = await ocrPdf("docs/aviso-comisiones.pdf");
console.log("  leido:", texto.replace(/\n/g, " / ").slice(0, 90), "...");
await ingestTexto(texto, "aviso-comisiones.pdf");

// 3. Preguntas: la primera esta en la FAQ; las ultimas SOLO viven en el PDF que
//    acabamos de OCR-ear (no estan en faq.txt).
console.log("\n— respuesta desde la FAQ (.txt) —");
console.log(await retrieve("cuanto cuesta una transferencia SPEI?"));

console.log("\n— respuesta SOLO del PDF escaneado (via OCR) —");
console.log(await retrieve("cuanto cuesta una transferencia SPEI mayor a 100 mil?"));
console.log("---");
console.log(await retrieve("que es la cuenta premium PR-2026?"));
