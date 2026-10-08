import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { readFileSync } from "node:fs";

// "El agente hace OCR": el PDF esta ESCANEADO (no tiene capa de texto), asi que
// Claude lo lee con vision y transcribe lo que ve. Lo que devuelve entra al RAG
// igual que cualquier otro documento (ingestTexto en rag.ts).
export async function ocrPdf(path: string): Promise<string> {
  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-5"),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Este es un documento escaneado. Transcribe TODO su texto, una idea " +
              "por linea, sin comentarios ni vinetas; devuelve solo el texto.",
          },
          { type: "file", data: readFileSync(path), mediaType: "application/pdf" },
        ],
      },
    ],
  });
  return text;
}
