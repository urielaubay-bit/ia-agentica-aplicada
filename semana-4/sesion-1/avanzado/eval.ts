// Tu "prueba" del reto: mide hit@3 y la abstencion. Corre desde sesion-1:
//   npx tsx avanzado/eval.ts
// Edita rag-avanzado.ts hasta que diga PASA. (El tutor puede cambiar el import a
// "./solucion.ts" para ver la meta.)
import { ingest, recuperar } from "./rag-avanzado.ts";

// Cada caso: la pregunta y un texto que DEBE aparecer en el mejor fragmento.
const casos = [
  { q: "cuanto cuesta una transferencia SPEI?", esperado: "gratuitas" },
  { q: "cual es mi limite diario en CU-1001?", esperado: "20,000" },
  { q: "como reporto un cargo que no reconozco?", esperado: "Reportar" },
  { q: "que necesito para pedir un credito?", esperado: "ingresos" },
  { q: "a que hora abren las sucursales el sabado?", esperado: "9 a 13" },
  { q: "cuanto paga la cuenta de ahorro?", esperado: "8%" },
];
const fueraDeAlcance = "cual es la capital de Francia?";

await ingest("docs");

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
console.log(aciertos >= 5 && abstencionOk ? "\nPASA ✅" : "\nAun no ✗  (ajusta UMBRAL / ALPHA / scoreLexico)");
