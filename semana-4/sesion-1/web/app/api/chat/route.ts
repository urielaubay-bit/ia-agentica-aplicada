import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool, stepCountIs, convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";
import { indexarUnaVez, buscar } from "../../rag-index";

export const runtime = "nodejs"; // embeddings + fs: necesita Node, no Edge.
export const dynamic = "force-dynamic";
export const maxDuration = 60; // la 1a peticion baja el modelo y hace OCR.

// UI generativa para RAG. Misma idea que Semana 2: UNA tool por tipo de
// respuesta, UN componente por tool. Aqui la tool RECUPERA del indice los
// fragmentos mas relevantes (con score y fuente) y el cliente los pinta como
// tarjetas de contexto. El modelo responde SOLO con esos fragmentos (grounding)
// y el usuario VE de donde salio cada dato: la FAQ (.txt) o el PDF escaneado que
// el agente OCR-eo. Esto es RAG con las "costuras" a la vista.

const buscarEnBase = tool({
  description:
    "Busca en la base de conocimiento de NeuronBank (la FAQ, el aviso de comisiones y el estado de cuenta en PDF) los fragmentos mas relevantes a la pregunta. Devuelve cada fragmento con su score de similitud y su fuente. Llama SIEMPRE esta tool antes de responder.",
  inputSchema: z.object({
    pregunta: z.string().describe("La pregunta del usuario, tal cual."),
  }),
  execute: async ({ pregunta }) => {
    await indexarUnaVez(); // construye el indice la 1a vez (embeddings + OCR)
    // buscar() ya expande a ~80% del documento dominante (RAG_COBERTURA) y une con
    // los mejores hits de otras fuentes: cobertura casi total para enumerar/contar,
    // sin perder respuestas de documentos chicos. La abstencion sigue dependiendo
    // solo del mejor score, no de la cobertura.
    const fuentes = await buscar(pregunta);
    const mejorScore = fuentes[0]?.score ?? 0;
    return { pregunta, fuentes, mejorScore };
  },
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: anthropic("claude-sonnet-4-5"),
    system:
      "Eres el asistente RAG de NeuronBank. Para CADA pregunta del usuario, primero llama la tool buscarEnBase con su pregunta. " +
      "Responde UNICAMENTE con lo que digan los fragmentos recuperados; no uses conocimiento externo ni inventes cifras. " +
      "Si no llegan fragmentos, o no contienen la respuesta, dilo claro: 'No tengo esa informacion en la base de conocimiento'. Abstenerse es lo correcto. " +
      "Si piden una lista o un conteo (p. ej. movimientos o cargos de una fecha), enumera o cuenta SOLO los que aparezcan en los fragmentos. " +
      "Responde breve y en lenguaje natural, sin markdown, sin HTML ni codigo: las tarjetas de fuentes las dibuja la interfaz.",
    messages: convertToModelMessages(messages),
    tools: { buscarEnBase },
    stopWhen: stepCountIs(3),
  });
  return result.toUIMessageStreamResponse();
}
