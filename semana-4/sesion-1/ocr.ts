import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { readFileSync } from "node:fs";

// "El agente hace OCR": el documento (un PDF escaneado o una imagen) no tiene
// capa de texto, asi que Claude lo lee con vision y transcribe lo que ve. Un PDF
// escaneado y una foto/screenshot de un documento son el MISMO problema: visión.
// Lo que devuelve entra al RAG igual que cualquier otro documento (ingestTexto en
// rag.ts). El nombre "ocrPdf" se conserva por compatibilidad; ya acepta imagenes.
export async function ocrPdf(path: string): Promise<string> {
  const data = readFileSync(path);
  const esImagen = /\.(png|jpe?g|webp|gif)$/i.test(path);
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
          // Imagen -> parte 'image'; PDF -> parte 'file'. Claude lee ambos.
          esImagen
            ? { type: "image", image: data }
            : { type: "file", data, mediaType: "application/pdf" },
        ],
      },
    ],
  });
  return text;
}
