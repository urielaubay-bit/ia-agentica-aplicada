import path from "node:path";
import { ingest, ingestTexto, buscar, estadoIndice, type Fragmento } from "../../rag";
import { ocrPdf } from "../../ocr";

// Esta web es solo un FRONT-END nuevo sobre el MISMO pipeline de la sesion:
// reusa tal cual ../../rag.ts (chunking + embeddings locales + recuperacion) y
// ../../ocr.ts (el agente OCR-ea el PDF escaneado con vision de Claude). No se
// reescribe nada del RAG: la UI solo lo consume.

// La base de conocimiento vive en semana-4/sesion-1/docs, un nivel arriba de
// esta app. npm run dev se corre DESDE web/, asi que cwd = web/ y ".." = sesion-1.
const SESION1 = path.resolve(process.cwd(), "..");
const DOCS = path.join(SESION1, "docs");
const PDF = path.join(DOCS, "aviso-comisiones.pdf");

type Fase = "idle" | "indexando" | "listo" | "error";
let estado: { fase: Fase; error?: string } = { fase: "idle" };
let promesa: Promise<void> | null = null;

async function construir() {
  try {
    estado = { fase: "indexando" };
    // 1. La FAQ en texto (los .txt de docs/).
    await ingest(DOCS);
    // 2. El agente hace OCR del PDF ESCANEADO y lo mete al MISMO indice.
    //    Necesita ANTHROPIC_API_KEY (Claude hace el OCR con vision).
    const texto = await ocrPdf(PDF);
    await ingestTexto(texto, "aviso-comisiones.pdf");
    estado = { fase: "listo" };
  } catch (e) {
    estado = { fase: "error", error: e instanceof Error ? e.message : String(e) };
    promesa = null; // permite reintentar en la siguiente peticion
    throw e;
  }
}

// Idempotente: construye el indice UNA sola vez (bajar el modelo + OCR son
// caros). Todas las peticiones comparten la misma promesa.
export function indexarUnaVez(): Promise<void> {
  if (!promesa) promesa = construir();
  return promesa;
}

// Estado en vivo para el panel izquierdo: fase + conteo de fragmentos por fuente.
export function estadoIndexado() {
  return { ...estado, ...estadoIndice() };
}

export { buscar };
export type { Fragmento };
