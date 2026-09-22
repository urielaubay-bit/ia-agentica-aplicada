// Semana 1 · Sesión 2 · Arranca con una ALUCINACIÓN (dominio: banca)
// Objetivo: ver el problema de raíz con tus propios ojos ANTES de darle forma
// a los datos. Este "asistente de NeuronBank" NO tiene tools ni acceso al core
// bancario: es solo el modelo. Le pedimos un dato EXACTO y verificable que no
// tiene forma de conocer (saldo, monto, fecha y folio de una cuenta concreta).
// El modelo responderá con total seguridad... e inventará el dato.
//
// Eso es una alucinación: una respuesta plausible y bien redactada, pero falsa.
// El modelo optimiza por SONAR correcto, no por SER correcto.
//
// La salida estructurada (el resto de esta sesión) arregla la FORMA (JSON válido,
// campos completos). La VERDAD del dato es otra capa: tools con datos reales
// (Semana 3) y grounding con RAG (Semana 4).
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

const model = anthropic("claude-sonnet-4-5");

// Un dato bancario que el modelo NO puede saber: no le dimos ni la cuenta ni el core.
const pregunta =
  "Eres el asistente de NeuronBank. ¿Cuál es el saldo actual EXACTO de la cuenta " +
  "CU-1001, y el monto, la fecha y el número de folio de su última transferencia?";

console.log("Pregunta (SIN tools, SIN datos reales):\n" + pregunta + "\n");

const { text } = await generateText({
  model,
  // Sin `tools` a propósito: queremos ver qué hace el modelo por su cuenta.
  system:
    "Eres un asistente bancario servicial. Responde de forma concreta y con datos específicos.",
  prompt: pregunta,
});

console.log("Respuesta del modelo:\n" + text + "\n");
console.log(
  "⚠️  Ese saldo, ese folio y esa fecha son INVENTADOS: el modelo no tiene acceso\n" +
    "   a la cuenta CU-1001. Suena correcto, pero no ES correcto. Eso es una alucinación.\n" +
    "   Apréndela a reconocer por ese exceso de confianza sobre datos que no tiene.\n" +
    "   La FORMA (Zod) no la arregla; la VERDAD llega con tools reales (S3) y RAG (S4).\n\n" +
    "   Compáralo: en semana-1/sesion-1/avanzado-banca/ el mismo asistente SÍ tiene\n" +
    "   tools de solo lectura sobre el core, y ya no inventa: consulta el dato real."
);
