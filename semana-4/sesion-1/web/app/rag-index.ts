import path from "node:path";
import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { ocrPdf } from "../../ocr";
import type { Hit } from "../../avanzado/solucion";

// Para preguntar sobre documentos REALES (como el estado de cuenta), el front
// reusa el RECUPERADOR AVANZADO de la sesion (../../avanzado/solucion.ts):
// embeddings multilingues + busqueda hibrida (coseno + lexico) + chunking por
// ventanas + dedup + abstencion. El recuperador basico (pura similitud en ingles)
// no alcanza para una pregunta natural sobre un PDF de 8 hojas. El OCR lo hace el
// agente (../../ocr.ts).
//
// Ese modulo baja un modelo multilingue (~120MB) en un top-level await, asi que lo
// cargamos con import() DINAMICO dentro de construir(): el modelo se baja en la 1a
// peticion, no al importar la ruta (eso rompia el build al pasarse de tiempo). El
// tipo Hit entra por import type, que se borra en compilacion (no dispara la carga).
type Avanzado = typeof import("../../avanzado/solucion");
let mod: Avanzado | null = null;

// La base vive en semana-4/sesion-1/docs (un nivel arriba de esta app web).
// npm run dev se corre DESDE web/, asi que cwd = web/ y ".." = sesion-1.
const SESION1 = path.resolve(process.cwd(), "..");
const DOCS = path.join(SESION1, "docs");

type Fase = "idle" | "indexando" | "listo" | "error";
let estado: { fase: Fase; error?: string } = { fase: "idle" };
let promesa: Promise<void> | null = null;

// OCR CACHEADO: el agente OCR-ea cada PDF UNA vez y guarda docs/<pdf>.ocr.txt. Las
// siguientes cargas reusan el cache (no re-OCR, no costo). Para re-OCR, borra el
// .ocr.txt. Necesita ANTHROPIC_API_KEY solo la primera vez (para generar el cache).
async function ocrCacheado(pdf: string): Promise<string> {
  const cache = path.join(DOCS, `${pdf}.ocr.txt`);
  if (existsSync(cache)) return readFileSync(cache, "utf8");
  const texto = await ocrPdf(path.join(DOCS, pdf));
  writeFileSync(cache, texto);
  return texto;
}

async function construir() {
  try {
    estado = { fase: "indexando" };
    mod = await import("../../avanzado/solucion"); // aqui corre el top-level await (modelo)
    await mod.ingest(DOCS); // texto plano (faq.txt)
    // Todos los PDF de docs/ entran por OCR (cacheado) al mismo indice.
    for (const pdf of readdirSync(DOCS).filter((f) => f.toLowerCase().endsWith(".pdf"))) {
      await mod.ingestTexto(await ocrCacheado(pdf), pdf);
    }
    estado = { fase: "listo" };
  } catch (e) {
    estado = { fase: "error", error: e instanceof Error ? e.message : String(e) };
    promesa = null; // permite reintentar en la siguiente peticion
    throw e;
  }
}

// Idempotente: construye el indice UNA sola vez. Todas las peticiones comparten
// la misma promesa.
export function indexarUnaVez(): Promise<void> {
  if (!promesa) promesa = construir();
  return promesa;
}

// Fraccion de la fuente dominante que se devuelve como contexto (0..1). 0.8 =
// 80% de los fragmentos de ese PDF; 1 = el documento completo. Configurable con
// RAG_COBERTURA. A mas cobertura, mejores respuestas de enumeracion/conteo, pero
// mas tokens por pregunta.
const COBERTURA = Number(process.env.RAG_COBERTURA ?? "0.8");

// Recuperacion para la tool, en dos pasos:
//  1) top-k normal, que sirve para ABSTENERSE (si nada supera el umbral) y para
//     IDENTIFICAR el documento dominante = el de mayor score AGREGADO en el top-k
//     (robusto: un distractor suelto de otra fuente no manda);
//  2) EXPANDIR a ~COBERTURA de los fragmentos de ese documento (cobertura casi
//     total, clave para "todos los movimientos", "cuantos hay", "es el unico"),
//     y UNIR con los mejores hits de otras fuentes para no perder una respuesta
//     que viva en un documento mas chico.
export async function buscar(pregunta: string, k = 8): Promise<Hit[]> {
  await indexarUnaVez();
  const base = (await mod!.recuperar(pregunta, k)) ?? [];
  // Palabra clave: fragmentos con terminos distintivos (p.ej. "claude") que el
  // score semantico no distingue del ruido. Rescata preguntas de keyword exacto.
  const kw = mod!.buscarKeyword(pregunta);
  // Abstencion: solo si NI lo semantico NI lo lexico encontraron algo.
  if (base.length === 0 && kw.length === 0) return [];

  // Si lo semantico identifico un documento, EXPANDE a ~COBERTURA de ese doc.
  let expandido: Hit[] = [];
  if (base.length > 0) {
    const agg = new Map<string, number>();
    for (const h of base) agg.set(h.fuente, (agg.get(h.fuente) ?? 0) + h.score);
    const fuente = [...agg.entries()].sort((a, b) => b[1] - a[1])[0][0];
    expandido = await mod!.recuperarDeFuente(pregunta, fuente, COBERTURA);
  }

  // Union (dedup por texto): cobertura del doc dominante + keyword + top-k base.
  const vistos = new Set<string>();
  const out: Hit[] = [];
  for (const h of [...expandido, ...kw, ...base]) {
    if (!vistos.has(h.text)) { vistos.add(h.text); out.push(h); }
  }
  return out;
}

// Estado en vivo para el panel izquierdo: fase + conteo de fragmentos por fuente.
export function estadoIndexado() {
  const conteo = mod ? mod.estadoIndice() : { total: 0, porFuente: {} as Record<string, number> };
  return { ...estado, ...conteo };
}

export type { Hit };
