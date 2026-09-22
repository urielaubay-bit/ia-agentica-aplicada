// Semana 1 · Sesión 2 · Arranca con una ALUCINACIÓN (dominio: banca)
//
// Objetivo: ver con tus propios ojos cómo el modelo produce contenido
// PLAUSIBLE, BIEN FORMATEADO y FALSO cuando cree que debería saber la respuesta.
//
// OJO — no confundas dos cosas:
//  - Si le pides un dato PRIVADO (el saldo de una cuenta real), un modelo bien
//    alineado te dirá honestamente que no tiene acceso. Eso NO es una
//    alucinación: es lo correcto, y es buena señal.
//  - En texto libre, a veces también se niega ("no tengo el PDF"). Por eso
//    aquí usamos generateObject: el schema EXIGE un número, así que no puede
//    responder con un disclaimer. Rellena la ficha aunque la tabla no exista.
//
// La salida estructurada arregla la FORMA. La VERDAD del contenido es otra
// capa: tools con datos reales (Semana 3) y RAG (Semana 4).
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

const model = anthropic("claude-sonnet-4-5");

const fichaSpei = z.object({
  operacionesRechazadas: z.number().describe("Numero exacto de SPEI rechazadas por fraude en 2023."),
  porcentajeSobreTotal: z.number().describe("Porcentaje sobre el total SPEI de 2023."),
  tituloTabla: z.string().describe("Titulo de la tabla citada."),
  pagina: z.number().describe("Pagina del informe."),
});

const { object } = await generateObject({
  model,
  schema: fichaSpei,
  system:
    "Eres el economista en jefe de NeuronBank. Ya leíste el Informe Anual de " +
    "Banxico 2023. Extraes la ficha de memoria, sin disclaimers.",
  prompt:
    "Tabla 12, capítulo 4, página 87 del Informe Anual Banxico 2023: " +
    "operaciones SPEI rechazadas por sospecha de fraude. " +
    "Devuelve numero exacto, porcentaje sobre el total SPEI 2023, titulo de la tabla y pagina.",
});

console.log("\n===== Ficha 'citada' del Informe Anual Banxico 2023 =====");
console.log(JSON.stringify(object, null, 2));

console.log(
  "\n⚠️  Correlo 2-3 veces: los números CAMBIAN (no hay tabla real que anclar).\n" +
    "   El Informe Anual 2023 sí existe; la Tabla 12 / pág. 87 de rechazos SPEI no.\n" +
    "   generateObject obliga a llenar el schema, así que inventa la cifra con\n" +
    "   formato perfecto: eso es una alucinación (suena correcto, no ES correcto).\n\n" +
    "   Contrast: si le pides el saldo de CU-1001 en texto libre, se niega\n" +
    "   (dato privado). Aquí fabrica porque el schema no admite 'no sé'.\n\n" +
    "   La FORMA (Zod) no arregla la VERDAD: tools reales (Semana 3) y RAG (S4).\n"
);
