import { pipeline } from "@xenova/transformers";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Modelo de embeddings que corre en tu maquina (primera vez descarga ~25MB).
const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

async function embed(text: string): Promise<number[]> {
  const out = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(out.data as Float32Array);
}
const cosine = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);

// Cada fragmento guarda su texto, su vector y DE DONDE salio (su fuente). La
// fuente es la clave para la UI: deja ver si la respuesta vino de la FAQ (.txt)
// o del PDF escaneado que el agente OCR-eo.
type Chunk = { text: string; vec: number[]; fuente: string };
const index: Chunk[] = [];

export async function ingest(dir = "docs") {
  // Solo archivos de texto; los binarios (PDF escaneado) entran por OCR -> ingestTexto.
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".txt"))) {
    const raw = readFileSync(join(dir, file), "utf8");
    for (const parrafo of raw.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)) {
      index.push({ text: parrafo, vec: await embed(parrafo), fuente: file });
    }
  }
  console.log(`Indexados ${index.length} fragmentos.`);
}

// Mete texto crudo al indice: p.ej. lo que el agente OCR-eo de un PDF escaneado.
// Una idea por linea = un fragmento.
export async function ingestTexto(texto: string, fuente = "texto") {
  const trozos = texto.split(/\n+/).map((s) => s.trim()).filter((s) => s.length > 2);
  for (const t of trozos) index.push({ text: t, vec: await embed(t), fuente });
  console.log(`Indexados ${trozos.length} fragmentos de ${fuente} (OCR).`);
}

// Recuperacion con provenance: devuelve los k fragmentos mas similares con su
// score (0..1) y su fuente. Es lo que alimenta las tarjetas de "fuentes" de la
// UI generativa: la respuesta se puede CITAR y se ve de donde salio cada dato.
export type Fragmento = { text: string; score: number; fuente: string };

export async function buscar(query: string, k = 3): Promise<Fragmento[]> {
  const q = await embed(query);
  return index
    .map((c) => ({ text: c.text, fuente: c.fuente, score: cosine(q, c.vec) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// retrieve() se mantiene igual que antes: el contexto como texto plano. Es lo
// que usa la version de terminal (probar-rag.ts). Ahora se apoya en buscar().
export async function retrieve(query: string, k = 3): Promise<string> {
  const frags = await buscar(query, k);
  return frags.map((f) => f.text).join("\n---\n");
}

// Estado del indice para la UI: cuantos fragmentos hay y de que fuente. Deja
// mostrar "la FAQ aporto N, el PDF OCR-eado aporto M".
export function estadoIndice() {
  const porFuente: Record<string, number> = {};
  for (const c of index) porFuente[c.fuente] = (porFuente[c.fuente] ?? 0) + 1;
  return { total: index.length, porFuente };
}
