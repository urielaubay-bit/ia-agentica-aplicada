import { indexarUnaVez, estadoIndexado } from "../../rag-index";

export const runtime = "nodejs";

// Dispara la construccion del indice (si aun no empezo) y devuelve su estado.
// El panel de la izquierda lo consulta cada pocos segundos para mostrar el flujo
// por fases: "indexando..." (OCR + embeddings) -> "listo". No espera a que
// termine: regresa el estado actual y el panel vuelve a preguntar.
export async function GET() {
  indexarUnaVez().catch(() => {}); // fire-and-forget; el estado reporta el error
  return Response.json(estadoIndexado());
}
