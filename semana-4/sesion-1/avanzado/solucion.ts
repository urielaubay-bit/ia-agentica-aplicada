// Solucion de referencia (para el tutor). Para probarla con el eval, cambia en
// avanzado/eval.ts el import a "./solucion.ts", o copia estas dos funciones a
// rag-avanzado.ts.
import { pipeline } from "@xenova/transformers";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const embedder = await pipeline("feature-extraction", "Xenova/paraphrase-multilingual-MiniLM-L12-v2");
async function embed(text: string): Promise<number[]> {
  const out = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(out.data as Float32Array);
}
const cosine = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);

const ALPHA = 0.6;
const UMBRAL = 0.30;

export type Hit = { text: string; score: number; fuente: string };
type Chunk = { text: string; vec: number[]; fuente: string };
const index: Chunk[] = [];

const terminos = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/).filter((t) => t.length > 1);

// PARTE 2 — puntaje lexico (recall de terminos de la query).
export function scoreLexico(query: string, texto: string): number {
  const q = terminos(query);
  if (q.length === 0) return 0;
  const t = new Set(terminos(texto));
  return q.filter((w) => t.has(w)).length / q.length;
}

export async function ingest(dir = "docs") {
  index.length = 0;
  for (const file of readdirSync(dir)) {
    const raw = readFileSync(join(dir, file), "utf8");
    for (const parrafo of raw.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)) {
      index.push({ text: parrafo, vec: await embed(parrafo), fuente: file });
    }
  }
  console.log(`Indexados ${index.length} fragmentos de ${dir}.`);
}

// PARTES 1 + 2 — recuperacion hibrida con abstencion.
export async function recuperar(query: string, k = 3): Promise<Hit[] | null> {
  const qv = await embed(query);
  const ranked = index
    .map((c) => ({
      text: c.text,
      fuente: c.fuente,
      score: ALPHA * cosine(qv, c.vec) + (1 - ALPHA) * scoreLexico(query, c.text),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
  if (ranked.length === 0 || ranked[0].score < UMBRAL) return null; // abstencion
  return ranked;
}
