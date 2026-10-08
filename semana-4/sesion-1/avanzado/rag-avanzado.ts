// Reto avanzado — RAG que no alucina.
// Trabajas sobre la misma base de NeuronBank (../docs via "docs" al correr desde sesion-1).
// Implementa las partes marcadas con TODO hasta que `avanzado/eval.ts` pase.
import { pipeline } from "@xenova/transformers";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Embeddings MULTILINGUES en tu maquina (1a vez descarga ~120MB). A diferencia de
// rag.ts (modelo en ingles), este entiende espanol de verdad: una pregunta fuera de
// alcance cae a ~0.1 de coseno, y por eso el umbral de abstencion puede funcionar.
const embedder = await pipeline("feature-extraction", "Xenova/paraphrase-multilingual-MiniLM-L12-v2");
async function embed(text: string): Promise<number[]> {
  const out = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(out.data as Float32Array);
}
const cosine = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);

// Las dos perillas que vas a ajustar.
const ALPHA = 0.6;    // peso de lo semantico vs lo lexico (0..1)
const UMBRAL = 0.30;  // por debajo de esto, el recuperador se abstiene

export type Hit = { text: string; score: number; fuente: string };
type Chunk = { text: string; vec: number[]; fuente: string };
const index: Chunk[] = [];

// Normaliza para comparar terminos: minusculas, sin acentos, sin puntuacion.
const terminos = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/).filter((t) => t.length > 1);

// ── PARTE 2 ─────────────────────────────────────────────────────────────────
// TODO: puntaje lexico en 0..1 = fraccion de los terminos de la query que
// aparecen en el texto. (Rescata tokens exactos que el embedding pierde:
// CU-1001, 800-NEURON, CAT, cifras.)
// PISTA: terminos(query), un Set con terminos(texto), cuenta coincidencias.
export function scoreLexico(query: string, texto: string): number {
  return 0; // TODO
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

// ── PARTES 1 + 2 ────────────────────────────────────────────────────────────
// TODO: recuperacion HIBRIDA con UMBRAL de abstencion.
//   1. embed(query).
//   2. por cada chunk: score = ALPHA*cosine(q, chunk.vec) + (1-ALPHA)*scoreLexico(query, chunk.text).
//   3. ordena desc, toma top-k.
//   4. si no hay chunks o el mejor score < UMBRAL -> return null (abstencion).
export async function recuperar(query: string, k = 3): Promise<Hit[] | null> {
  return null; // TODO
}
