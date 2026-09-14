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

type Chunk = { text: string; vec: number[] };
const index: Chunk[] = [];

export async function ingest(dir = "docs") {
  for (const file of readdirSync(dir)) {
    const raw = readFileSync(join(dir, file), "utf8");
    for (const parrafo of raw.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)) {
      index.push({ text: parrafo, vec: await embed(parrafo) });
    }
  }
  console.log(`Indexados ${index.length} fragmentos.`);
}

export async function retrieve(query: string, k = 3): Promise<string> {
  const q = await embed(query);
  return index
    .map((c) => ({ c, score: cosine(q, c.vec) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((r) => r.c.text)
    .join("\n---\n");
}
