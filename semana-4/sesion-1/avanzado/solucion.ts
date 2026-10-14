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

// Dedup: no indexar el mismo texto dos veces. El estado de cuenta repite el
// encabezado (nombre, direccion) en cada una de sus 8 hojas; sin dedup esos
// fragmentos inundan el top-k.
const vistos = new Set<string>();

// Chunking con solapamiento para texto OCR-eado. Una idea por linea genera
// fragmentos minusculos que compiten entre si: "Saldo Promedio 13,812.21" pierde
// contra lineas casi identicas ("Saldo Promedio Gravable 0.00") y contra un
// distractor de la FAQ. Agrupando lineas vecinas en ventanas de ~360 caracteres
// (con solapamiento), el saldo queda junto a "Saldo Anterior / Saldo Final" y a
// "Informacion Financiera", con mucha mas senal para recuperarlo.
function ventanas(texto: string, maxChars = 360, solapeLineas = 2): string[] {
  const lineas = texto.split(/\n+/).map((s) => s.trim()).filter((s) => s.length > 2);
  const out: string[] = [];
  let i = 0;
  while (i < lineas.length) {
    const buf: string[] = [];
    let len = 0, j = i;
    while (j < lineas.length && (len < maxChars || buf.length === 0)) {
      buf.push(lineas[j]);
      len += lineas[j].length + 1;
      j++;
    }
    out.push(buf.join(" "));
    if (j >= lineas.length) break;
    i = Math.max(i + 1, j - solapeLineas); // avanza dejando solape
  }
  return out;
}

const terminos = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/).filter((t) => t.length > 1);

// PARTE 2 — puntaje lexico (recall de terminos de la query). Un termino cuenta
// si es un token exacto del texto O (para terminos de >=4 letras) aparece como
// SUBCADENA de un token. El split por caracteres no alfanumericos deja los
// codigos pegados ("2206260claude") como un solo token, asi que sin la subcadena
// una busqueda de "claude" nunca lo encontraba.
export function scoreLexico(query: string, texto: string): number {
  const q = terminos(query);
  if (q.length === 0) return 0;
  const toks = terminos(texto);
  const set = new Set(toks);
  const blob = toks.join(" ");
  const match = (w: string) => set.has(w) || (w.length >= 4 && blob.includes(w));
  return q.filter(match).length / q.length;
}

export async function ingest(dir = "docs") {
  index.length = 0;
  vistos.clear();
  // Solo texto plano. Un PDF leido como utf8 es basura binaria: los PDF entran
  // por OCR (ingestTexto). Los .ocr.txt son el cache del OCR y tambien van por
  // ingestTexto, no por aqui.
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".txt") && !f.endsWith(".ocr.txt"))) {
    const raw = readFileSync(join(dir, file), "utf8");
    for (const parrafo of raw.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)) {
      if (vistos.has(parrafo)) continue;
      vistos.add(parrafo);
      index.push({ text: parrafo, vec: await embed(parrafo), fuente: file });
    }
  }
  console.log(`Indexados ${index.length} fragmentos de ${dir}.`);
}

// Texto crudo (p.ej. lo que el agente OCR-eo de un PDF) al indice. Lo agrupa en
// ventanas con solapamiento (ventanas()) y dedup: un documento largo como el
// estado de cuenta se vuelve pocos fragmentos ricos, no cientos de lineas sueltas.
export async function ingestTexto(texto: string, fuente = "texto") {
  let n = 0;
  for (const trozo of ventanas(texto)) {
    if (vistos.has(trozo)) continue;
    vistos.add(trozo);
    index.push({ text: trozo, vec: await embed(trozo), fuente });
    n++;
  }
  console.log(`Indexados ${n} fragmentos de ${fuente} (OCR, ventanas).`);
}

// Ranking crudo (hibrido, SIN abstencion): los k fragmentos mas relevantes con
// su score. Es la base de recuperar(); tambien sirve para identificar el
// documento dominante aunque ningun fragmento pase el umbral.
export async function rankear(query: string, k = 3): Promise<Hit[]> {
  const qv = await embed(query);
  return index
    .map((c) => ({
      text: c.text,
      fuente: c.fuente,
      score: ALPHA * cosine(qv, c.vec) + (1 - ALPHA) * scoreLexico(query, c.text),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// PARTES 1 + 2 — recuperacion hibrida con abstencion.
export async function recuperar(query: string, k = 3): Promise<Hit[] | null> {
  const ranked = await rankear(query, k);
  if (ranked.length === 0 || ranked[0].score < UMBRAL) return null; // abstencion
  return ranked;
}

// Estado del indice para la UI: cuantos fragmentos hay y de que fuente.
export function estadoIndice() {
  const porFuente: Record<string, number> = {};
  for (const c of index) porFuente[c.fuente] = (porFuente[c.fuente] ?? 0) + 1;
  return { total: index.length, porFuente };
}

// Recupera dentro de UNA sola fuente y devuelve una fraccion alta de SUS
// fragmentos (p.ej. 0.8 = 80%), ordenados por relevancia. Util para preguntas de
// COBERTURA/enumeracion sobre un documento ("todos los movimientos", "cuantos
// hay"), donde el top-k normal se queda corto: aqui casi todo el documento entra
// al contexto. Para un doc chico es, en la practica, QA de documento completo.
export async function recuperarDeFuente(query: string, fuente: string, frac = 0.8): Promise<Hit[]> {
  const qv = await embed(query);
  const dela = index.filter((c) => c.fuente === fuente);
  if (dela.length === 0) return [];
  const k = Math.max(1, Math.ceil(dela.length * Math.min(1, Math.max(0, frac))));
  return dela
    .map((c) => ({ text: c.text, fuente: c.fuente, score: ALPHA * cosine(qv, c.vec) + (1 - ALPHA) * scoreLexico(query, c.text) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// Busqueda por PALABRA CLAVE (sin embeddings) para terminos DISTINTIVOS: los que
// aparecen en POCOS fragmentos (p.ej. "claude", pegado en un codigo de referencia).
// El embedder mini no los separa del ruido por score (una pregunta fuera de tema
// puntua mas alto), pero un match exacto por subcadena si. Ignora los terminos
// comunes (muchos fragmentos) para no inundar. La abstencion real la decide luego
// el LLM: si el fragmento no responde, no inventa.
export function buscarKeyword(
  query: string,
  maxDF = Math.max(3, Math.ceil(index.length * 0.12)),
  tope = 15,
): Hit[] {
  const q = [...new Set(terminos(query))].filter((w) => w.length >= 4);
  if (q.length === 0) return [];
  const blobs = index.map((c) => terminos(c.text).join(" "));
  const df = (w: string) => blobs.reduce((n, b) => n + (b.includes(w) ? 1 : 0), 0);
  const distintivos = q.filter((w) => { const d = df(w); return d >= 1 && d <= maxDF; });
  if (distintivos.length === 0) return [];
  const out: Hit[] = [];
  for (let i = 0; i < index.length; i++) {
    if (distintivos.some((w) => blobs[i].includes(w))) {
      out.push({ text: index[i].text, fuente: index[i].fuente, score: scoreLexico(query, index[i].text) });
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, tope);
}
