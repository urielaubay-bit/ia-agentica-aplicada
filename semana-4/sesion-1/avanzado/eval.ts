// Tu "prueba" del reto: mide hit@3 y la abstencion. Corre desde sesion-1:
//   npx tsx avanzado/eval.ts
// Edita rag-avanzado.ts hasta que diga PASA. (El tutor puede cambiar el import a
// "./solucion.ts" para ver la meta.)
import "dotenv/config";
import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ingest, ingestTexto, recuperar } from "./rag-avanzado.ts";
import { ocrPdf } from "../ocr.ts";

// Cada caso: la pregunta y un texto que DEBE aparecer en el mejor fragmento.
const casos = [
  { q: "cuanto cuesta una transferencia SPEI menor a 100 mil?", esperado: "5 pesos" },
  { q: "cual es mi limite diario en CU-1001?", esperado: "20,000" },
  { q: "como reporto un cargo que no reconozco?", esperado: "Reportar" },
  { q: "que necesito para pedir un credito?", esperado: "ingresos" },
  { q: "a que hora abren las sucursales el sabado?", esperado: "9 a 13" },
  { q: "cuanto paga la cuenta de ahorro?", esperado: "8%" },
  // Este SOLO vive en el PDF del estado de cuenta (via OCR), no en faq.txt.
  { q: "cual es el saldo promedio del estado de cuenta de Mariana Lopez Soto?", esperado: "13,812.21" },
];
const fueraDeAlcance = "cual es la capital de Francia?";

// OCR CACHEADO: el agente (Claude con vision, ../ocr.ts) OCR-ea cada PDF de docs/
// UNA vez y guarda el texto en docs/<pdf>.ocr.txt. Las siguientes corridas reusan
// el cache, asi tunear UMBRAL/ALPHA es rapido y no vuelve a llamar al modelo.
// Para re-OCR, borra el .ocr.txt. Necesita ANTHROPIC_API_KEY en .env.
async function ocrDocs(dir = "docs") {
  for (const pdf of readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".pdf"))) {
    const cache = join(dir, `${pdf}.ocr.txt`);
    let texto: string;
    if (existsSync(cache)) {
      texto = readFileSync(cache, "utf8");
    } else {
      console.log(`OCR (agente) de ${pdf}... (la 1a vez tarda)`);
      texto = await ocrPdf(join(dir, pdf));
      writeFileSync(cache, texto);
    }
    await ingestTexto(texto, pdf);
  }
}

await ingest("docs"); // texto plano (faq.txt); ingest vacia el indice, va primero
await ocrDocs("docs"); // PDFs via OCR del agente (cacheado)

let aciertos = 0;
for (const { q, esperado } of casos) {
  const hits = await recuperar(q, 3);
  const ok = !!hits && hits.some((h) => h.text.includes(esperado));
  if (ok) aciertos++;
  console.log(`${ok ? "OK " : "XX "} ${q}  ->  ${hits ? `[${hits[0].score.toFixed(2)}] ${hits[0].text.slice(0, 48)}...` : "(abstencion)"}`);
}

const abst = await recuperar(fueraDeAlcance, 3);
const abstencionOk = abst === null;
console.log(`\nhit@3: ${aciertos}/${casos.length}`);
console.log(`abstencion (pregunta fuera de alcance): ${abstencionOk ? "OK -> null" : "XX -> recupero ruido"}`);
console.log(aciertos >= 6 && abstencionOk ? "\nPASA ✅" : "\nAun no ✗  (ajusta UMBRAL / ALPHA / scoreLexico)");
