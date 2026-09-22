// Semana 1 · Sesión 2 · Arranca con una ALUCINACIÓN (dominio: banca)
//
// Objetivo: ver con tus propios ojos cómo el modelo produce contenido
// PLAUSIBLE, BIEN FORMATEADO y FALSO cuando cree que debería saber la respuesta.
//
// OJO — no confundas dos cosas:
//  - Si le pides un dato PRIVADO (el saldo de una cuenta real), un modelo bien
//    alineado te dirá honestamente que no tiene acceso. Eso NO es una
//    alucinación: es lo correcto, y es buena señal.
//  - La alucinación aparece cuando el modelo cree que el dato es "conocimiento
//    general" y lo inventa con total seguridad. Por eso aquí le pedimos
//    referencias académicas y una cita regulatoria exacta: casi siempre
//    fabricará DOIs, títulos y artículos que NO existen.
//
// La salida estructurada (el resto de la sesión) arregla la FORMA. La VERDAD del
// contenido es otra capa: tools con datos reales (Semana 3) y RAG (Semana 4).
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

const model = anthropic("claude-sonnet-4-5");

// Nudge hacia el fallo: le pedimos que sea concreto y sin advertencias.
const system =
  "Eres un analista bancario experto y resolutivo. Responde SIEMPRE de forma " +
  "concreta y específica, con nombres, cifras y citas. No agregues advertencias " +
  "ni digas que no estás seguro.";

async function preguntar(titulo: string, prompt: string) {
  const { text } = await generateText({ model, system, prompt });
  console.log("\n===== " + titulo + " =====");
  console.log("Prompt: " + prompt + "\n");
  console.log(text);
}

// 1) Referencias fabricadas: el disparador de alucinación más reproducible.
await preguntar(
  "Bibliografía académica (con DOI)",
  "Para un informe sobre detección de fraude bancario con IA, dame 3 " +
    "referencias académicas revisadas por pares que pueda citar, cada una con " +
    "autor, año, título, revista y su DOI exacto."
);

// 2) Cita textual de un artículo regulatorio que (casi seguro) no existe.
await preguntar(
  "Cita regulatoria exacta",
  "Cita TEXTUALMENTE el Artículo 275 bis de la Ley de Instituciones de Crédito " +
    "de México, que regula el uso de modelos de IA para aprobar créditos, e " +
    "indica la fecha exacta de su última reforma."
);

console.log(
  "\n⚠️  Verifícalo: busca esos DOIs y ese 'Artículo 275 bis'. Lo más probable es\n" +
    "   que NO existan. El modelo los redactó con formato perfecto y total\n" +
    "   seguridad: eso es una alucinación (suena correcto, pero no ES correcto).\n" +
    "   Reconócela por ese exceso de confianza sobre datos que no tiene.\n\n" +
    "   La FORMA (Zod / structured output) no arregla esto; la VERDAD llega con\n" +
    "   tools sobre datos reales (Semana 3) y grounding con RAG (Semana 4).\n\n" +
    "   Nota: si en alguna corrida el modelo admite honestamente que no lo sabe,\n" +
    "   ese también es el comportamiento que queremos aprender a distinguir.\n" +
    "   Vuelve a correrlo: la fabricación aparece casi siempre en las referencias."
);
