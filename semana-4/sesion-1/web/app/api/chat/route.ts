import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool, stepCountIs, convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";
import { indexarUnaVez, buscar } from "../../rag-index";

export const runtime = "nodejs"; // embeddings + fs: necesita Node, no Edge.
export const maxDuration = 60; // la 1a peticion baja el modelo y hace OCR.

// UI generativa para RAG. Misma idea que Semana 2: UNA tool por tipo de
// respuesta, UN componente por tool. Aqui la tool RECUPERA del indice los
// fragmentos mas relevantes (con score y fuente) y el cliente los pinta como
// tarjetas de contexto. El modelo responde SOLO con esos fragmentos (grounding)
// y el usuario VE de donde salio cada dato: la FAQ (.txt) o el PDF escaneado que
// el agente OCR-eo. Esto es RAG con las "costuras" a la vista.

const buscarEnBase = tool({
  description:
    "Busca en la base de conocimiento de NeuronBank (la FAQ y el aviso de comisiones escaneado) los fragmentos mas relevantes a la pregunta. Devuelve cada fragmento con su score de similitud y su fuente. Llama SIEMPRE esta tool antes de responder.",
  inputSchema: z.object({
    pregunta: z.string().describe("La pregunta del usuario, tal cual."),
  }),
  execute: async ({ pregunta }) => {
    await indexarUnaVez(); // construye el indice la 1a vez (embeddings + OCR)
    const fuentes = await buscar(pregunta, 4);
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
      "Si los fragmentos no contienen la respuesta (o el mejor score es bajo, por debajo de ~0.3), dilo claro: 'No tengo esa informacion en la base de conocimiento'. Abstenerse es lo correcto. " +
      "Responde en 1 o 2 frases, en lenguaje natural, sin markdown, sin HTML ni codigo: las tarjetas de fuentes las dibuja la interfaz.",
    messages: convertToModelMessages(messages),
    tools: { buscarEnBase },
    stopWhen: stepCountIs(3),
  });
  return result.toUIMessageStreamResponse();
}
